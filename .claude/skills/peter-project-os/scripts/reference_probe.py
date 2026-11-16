#!/usr/bin/env python3
"""Reference interpretation helper: inspect video, sample frames, compare aligned clips.

This is deliberately modest: a visual evidence utility, NOT an animation re-creator,
source inspector, browser recorder, easing detector, or perceptual-quality oracle.
Requires: opencv-python, numpy, Pillow. Usage: --help / subcommand --help.
"""
import argparse
import json
import math
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
    from PIL import Image, ImageDraw
except ImportError as exc:
    raise SystemExit('Install dependencies: pip install opencv-python numpy Pillow') from exc


def video_info(path):
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise ValueError(f'Cannot open video: {path}')
    fps = float(cap.get(cv2.CAP_PROP_FPS))
    count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if not fps or w <= 0 or h <= 0:
        cap.release()
        raise ValueError('Invalid video FPS or dimensions')
    info = {'file': str(path), 'width': w, 'height': h, 'reported_fps': round(fps, 5),
            'frame_count': count, 'estimated_duration_sec': round(count / fps, 5),
            'caution': 'Source cadence from container metadata; dropped/VFR frames and audio timing not analyzed.'}
    return cap, info


def get_frame(cap, sec):
    cap.set(cv2.CAP_PROP_POS_MSEC, sec * 1000.0)
    ok, frame = cap.read()
    if not ok:
        return None
    return frame


def timespan(dur, start, end, fps, cap=2000):
    end = min(float(dur), float(end) if end is not None else float(dur))
    if start < 0 or start >= end:
        raise ValueError('Expected 0 <= start < end <= duration')
    if fps <= 0 or not math.isfinite(fps):
        raise ValueError('FPS must be a finite positive number')
    n = int(math.ceil((end-start) * fps))
    if n > cap:
        raise ValueError(f'{n} samples exceeds safety cap {cap}. Use a smaller window or lower --fps.')
    return [round(start+i / fps, 6) for i in range(n) if start+i/fps < end-1e-7]


def roi_parse(roi):
    if not roi:
        return None
    vals = [int(x.strip()) for x in roi.split(',')]
    if len(vals) != 4 or any(x < 0 for x in vals[:2]) or any(x <= 0 for x in vals[2:]):
        raise ValueError('ROI must be x,y,width,height with nonnegative position and positive size')
    return vals


def crop(frame, roi):
    if roi is None:
        return frame
    x,y,w,h = roi
    H,W=frame.shape[:2]
    if x+w>W or y+h>H:
        raise ValueError(f'ROI exceeds video bounds ({W}x{H}): {roi}')
    return frame[y:y+h, x:x+w]


def save_json(path, data):
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    Path(path).write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')


def build_contact(files, out, cols=4, width=300):
    if not files:
        return
    # split sheets to avoid massive images
    per_sheet=60
    for page in range(math.ceil(len(files)/per_sheet)):
        segment=files[page*per_sheet:(page+1)*per_sheet]
        sample=Image.open(segment[0][0]); ratio=sample.height/sample.width
        th=max(1,round(width*ratio)); cell_h=th+28
        rows=math.ceil(len(segment)/cols)
        canvas=Image.new('RGB',(cols*width,rows*cell_h),'white')
        pen=ImageDraw.Draw(canvas)
        for i,(path,time) in enumerate(segment):
            im=Image.open(path).convert('RGB'); im.thumbnail((width,th))
            x=(i%cols)*width; y=(i//cols)*cell_h
            canvas.paste(im,(x,y+28))
            pen.text((x+8,y+7),f'{time:0.3f}s',fill='black')
        suffix=f'_{page:02d}' if len(files)>per_sheet else ''
        canvas.save(out/f'contact{suffix}.jpg',quality=88)


def cmd_inspect(args):
    cap,info=video_info(args.video);cap.release()
    if args.out:save_json(args.out,info)
    print(json.dumps(info,indent=2))


def cmd_frames(args):
    cap,info=video_info(args.video)
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    times=timespan(info['estimated_duration_sec'],args.start,args.end,args.fps,cap=args.max_frames)
    region=roi_parse(args.roi)
    records=[];files=[]
    try:
        for n,t in enumerate(times):
            frame=get_frame(cap,t)
            if frame is None:continue
            frame=crop(frame,region)
            name=f'frame_{n:05d}_{int(round(t*1000)):08d}ms.png'
            path=out/name
            if not cv2.imwrite(str(path),frame):raise OSError(f'Image write failed: {path}')
            files.append((str(path),t));records.append({'time_sec':t,'image':name})
    finally:
        cap.release()
    if args.contact:
        build_contact(files,out,cols=args.cols,width=args.thumb_width)
    report={'source':info,'sample_fps':args.fps,'requested_start_sec':args.start,
            'requested_end_sec':args.end,'roi':region,'frames':records,
            'caution':'Frames are samples; timing, animation triggers, audio and source implementation remain unverified.'}
    save_json(out/'frames-manifest.json',report)
    print(f'Saved {len(records)} frames to {out}.')


def cmd_compare(args):
    reference,refinfo=video_info(args.reference)
    candidate,candinfo=video_info(args.candidate)
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    try:
        if (refinfo['width'],refinfo['height']) != (candinfo['width'],candinfo['height']) and not args.resize_candidate:
            raise ValueError('Reference and candidate dimensions differ. Match viewport, or explicitly pass --resize-candidate (less reliable).')
        duration=min(refinfo['estimated_duration_sec'],candinfo['estimated_duration_sec']-args.offset_sec)
        if duration <= 0:
            raise ValueError('Candidate offset leaves no comparable duration.')
        if args.offset_sec < 0:
            raise ValueError('Use a nonnegative --offset-sec; trim sources for negative offsets.')
        times=timespan(duration,args.start,args.end,args.fps,cap=args.max_frames)
        region=roi_parse(args.roi)
        per=[];examples=[]
        for i,t in enumerate(times):
            a=get_frame(reference,t)
            b=get_frame(candidate,t+args.offset_sec)
            if a is None or b is None: continue
            if a.shape[:2]!=b.shape[:2]:
                b=cv2.resize(b,(a.shape[1],a.shape[0]),interpolation=cv2.INTER_LINEAR)
            a=crop(a,region);b=crop(b,region)
            diff=cv2.absdiff(a,b)
            abs_mean=float(diff.mean())
            rmse=float(np.sqrt(np.mean(diff.astype(np.float64)**2)))
            mismatch=float(np.mean(np.max(diff,axis=2)>args.threshold)*100.0)
            per.append({'reference_time_sec':t,'candidate_time_sec':round(t+args.offset_sec,6),
                        'mean_abs_difference_0_255':round(abs_mean,5),
                        'normalized_mean_abs_difference_pct':round(100*abs_mean/255,5),
                        'rmse_0_255':round(rmse,5),
                        'pixels_above_threshold_pct':round(mismatch,5)})
            if args.save_every > 0 and i % args.save_every == 0:
                # Static triptych showing source, candidate, red = mismatch intensity
                H,W=a.shape[:2]
                heat=np.zeros_like(diff)
                heat[:,:,2]=np.max(diff,axis=2)
                panel=np.hstack([a,b,heat])
                label=f'pair_{i:05d}_{int(round(t*1000)):08d}ms.jpg'
                cv2.imwrite(str(out/label),panel,[cv2.IMWRITE_JPEG_QUALITY,92])
                examples.append({'time_sec':t,'image':label})
        if not per:
            raise ValueError('No matching frames could be decoded for comparison.')
        means=[p['normalized_mean_abs_difference_pct'] for p in per]
        report={'reference':refinfo,'candidate':candinfo,'comparison':{
            'start_sec':args.start,'end_sec':args.end,'sample_fps':args.fps,
            'candidate_time_offset_sec':args.offset_sec,'roi':region,
            'resized_candidate':args.resize_candidate,'difference_threshold_0_255':args.threshold,
            'frame_pairs_compared':len(per),
            'mean_normalized_abs_difference_pct':round(float(np.mean(means)),5),
            'worst_time_sec':per[int(np.argmax(means))]['reference_time_sec'],
            'worst_frame_difference_pct':round(max(means),5),
            'mean_pixels_above_threshold_pct':round(float(np.mean([p['pixels_above_threshold_pct'] for p in per])),5)},
            'frames':per,'visual_examples':examples,
            'cautions':['Raw pixel difference is NOT perceptual similarity or proof of functional/motion equivalence.',
                        'Make sure captures have the same viewport/crop, input trigger, cursor path, fonts, color, and relative animation time.',
                        'Frames near transitions are sensitive to audio/video timestamp errors or dropped frames.',
                        'A low average error may hide brief timing or key-state failures; inspect per-frame errors.']}
        save_json(out/'comparison.json',report)
        print(json.dumps(report['comparison'],indent=2))
        print('Detailed frame report:',out/'comparison.json')
    finally:
        reference.release();candidate.release()


def cmd_activity(args):
    """Measure frame-to-frame *visual change*, not semantic motion or exact easing.

    The previous sampled frame is the baseline; camera cuts, scroll, captions,
    cursor, UI overlays and compression all contribute to apparent activity.
    """
    cap,info=video_info(args.video)
    out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    region=roi_parse(args.roi)
    samples=[]; prev=None; prev_t=None
    try:
        times=timespan(info['estimated_duration_sec'],args.start,args.end,args.fps,cap=args.max_frames)
        for t in times:
            frame=get_frame(cap,t)
            if frame is None: continue
            frame=crop(frame,region)
            if prev is not None:
                delta=cv2.absdiff(frame,prev)
                maxchan=np.max(delta,axis=2)
                mean=float(np.mean(delta)/255*100.0)
                changed=float(np.mean(maxchan>args.threshold)*100.0)
                samples.append({'from_sec':prev_t,'to_sec':t,
                                'normalized_mean_frame_change_pct':round(mean,5),
                                'pixels_above_threshold_pct':round(changed,5)})
            prev=frame;prev_t=t
    finally:
        cap.release()
    if not samples:
        raise ValueError('Need at least two decodable samples for frame activity.')
    report={'source':info,'sample_fps':args.fps,'roi':region,
            'comparison':'Each sample compared with immediately previous sampled frame',
            'samples':samples,
            'peak_interval':max(samples,key=lambda x:x['pixels_above_threshold_pct']),
            'cautions':['Activity measures visible pixel changes only, not object trajectories or exact easing.',
                        'Source can include scroll, compression, overlays, crossfades and camera cuts.',
                        'High activity does not necessarily mean important movement; interpret with sampled frames.']}
    save_json(out/'activity.json',report)
    print(f'Sampled {len(samples)+1} frames; frame activity written to {out/"activity.json"}')
    print('Peak change interval:',report['peak_interval'])


def main():
    p=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    sub=p.add_subparsers(dest='command',required=True)
    x=sub.add_parser('inspect',help='Show source dimensions/FPS/duration');x.add_argument('--video',required=True);x.add_argument('--out');x.set_defaults(func=cmd_inspect)
    x=sub.add_parser('frames',help='Extract frames at known timestamps, optionally contact sheet')
    x.add_argument('--video',required=True);x.add_argument('--out',required=True)
    x.add_argument('--fps',type=float,default=4);x.add_argument('--start',type=float,default=0);x.add_argument('--end',type=float)
    x.add_argument('--roi',help='x,y,width,height in source pixels');x.add_argument('--max-frames',type=int,default=2000)
    x.add_argument('--contact',action='store_true',default=True);x.add_argument('--no-contact',action='store_false',dest='contact')
    x.add_argument('--cols',type=int,default=4);x.add_argument('--thumb-width',type=int,default=300)
    x.set_defaults(func=cmd_frames)
    x=sub.add_parser('activity',help='Measure visual change between successive timestamped frames')
    x.add_argument('--video',required=True);x.add_argument('--out',required=True)
    x.add_argument('--fps',type=float,default=10);x.add_argument('--start',type=float,default=0);x.add_argument('--end',type=float)
    x.add_argument('--roi',help='x,y,width,height in source pixels');x.add_argument('--max-frames',type=int,default=2000)
    x.add_argument('--threshold',type=int,default=12)
    x.set_defaults(func=cmd_activity)
    x=sub.add_parser('compare',help='Compare video pixels at aligned timestamps')
    x.add_argument('--reference',required=True);x.add_argument('--candidate',required=True);x.add_argument('--out',required=True)
    x.add_argument('--fps',type=float,default=10);x.add_argument('--start',type=float,default=0);x.add_argument('--end',type=float)
    x.add_argument('--offset-sec',type=float,default=0,help='Compare reference t with candidate t + offset')
    x.add_argument('--roi',help='x,y,width,height in reference pixels')
    x.add_argument('--resize-candidate',action='store_true',help='Force size match; weakens comparison validity')
    x.add_argument('--threshold',type=int,default=12,help='Maximum RGB-channel pixel difference beyond which a pixel is counted')
    x.add_argument('--save-every',type=int,default=10,help='Every Nth comparison saved as reference | candidate | red heatmap; 0 disables')
    x.add_argument('--max-frames',type=int,default=2000)
    x.set_defaults(func=cmd_compare)
    args=p.parse_args()
    try:args.func(args)
    except (ValueError,OSError) as e:print('Error:',e,file=sys.stderr);sys.exit(2)

if __name__=='__main__':main()
