#!/usr/bin/env python3
"""Role-based palette contrast checker and static preview for Anti-Slop v3.

Uses WCAG 2.x sRGB relative luminance and contrast ratios; neither generates a
beautiful palette nor certifies full WCAG conformance. Python standard library.

Usage:
  python scripts/palette_probe.py --spec assets/color-tokens-example.json
  python scripts/palette_probe.py --spec assets/color-tokens-example.json --html palette.html --json report.json --strict
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

THRESHOLDS = {"normal-text": 4.5, "large-text": 3.0, "ui-component": 3.0}


def parse_hex(s: str) -> tuple[int, int, int]:
    if not isinstance(s, str) or not s.startswith("#"):
        raise ValueError(f"Expected #RGB or #RRGGBB, got {s!r}")
    h = s[1:]
    if len(h) == 3 and all(c in '0123456789abcdefABCDEF' for c in h):
        h = ''.join(c * 2 for c in h)
    if len(h) != 6 or any(c not in '0123456789abcdefABCDEF' for c in h):
        raise ValueError(f"Invalid hex color {s!r}")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def relative_luminance(s: str) -> float:
    # WCAG 2.x: sRGB colors are gamma-decoded with breakpoint 0.04045.
    def linear(v: int) -> float:
        x = v / 255
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = (linear(c) for c in parse_hex(s))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(a: str, b: str) -> float:
    x, y = relative_luminance(a), relative_luminance(b)
    hi, lo = sorted((x, y), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def analyze(spec: dict) -> dict:
    if not isinstance(spec, dict):
        raise ValueError('Root JSON must be an object')
    tokens = spec.get('tokens')
    pairs = spec.get('pairs')
    if not isinstance(tokens, dict) or not tokens:
        raise ValueError('"tokens" must be a nonempty object')
    if not isinstance(pairs, list) or not pairs:
        raise ValueError('"pairs" must be a nonempty array of real foreground/background pair definitions')
    for name, col in tokens.items():
        if not isinstance(name, str) or not name:
            raise ValueError('Token names must be nonempty strings')
        parse_hex(col)
    checks = []
    for i, row in enumerate(pairs):
        if not isinstance(row, dict):
            raise ValueError(f'Pair #{i+1} must be an object')
        fg, bg, usage = (row.get(k) for k in ('foreground', 'background', 'use'))
        if fg not in tokens or bg not in tokens:
            raise ValueError(f'Pair #{i+1} uses undefined token(s): {fg}, {bg}')
        if usage not in THRESHOLDS:
            raise ValueError(f'Pair #{i+1} use must be one of: {", ".join(THRESHOLDS)}')
        ratio = contrast_ratio(tokens[fg], tokens[bg])
        minimum = THRESHOLDS[usage]
        checks.append({'foreground': fg, 'background': bg, 'use': usage,
                       'ratio': round(ratio, 3), 'minimum': minimum,
                       'pass': ratio + 1e-10 >= minimum,
                       'purpose': row.get('purpose', '')})
    bad = [x for x in checks if not x['pass']]
    return {'name': spec.get('name', 'Unnamed palette'),
            'passed_pairs': len(checks)-len(bad), 'failed_pairs': len(bad),
            'pair_results': checks,
            'colors': {k: {'hex': v, 'luminance': round(relative_luminance(v), 5)} for k,v in tokens.items()},
            'caveats': [
                'Contrast checks cover only the foreground/background pairs supplied in the spec.',
                'This is WCAG 2.x contrast mathematics, not a complete accessibility audit.',
                'Gradients, overlays, imagery, fonts, context, focus visibility, color blindness and states require separate inspection.',
                'Palette role/visual quality cannot be determined from contrast numbers alone.']}


def render_html(spec: dict, report: dict) -> str:
    tokens = spec['tokens']
    needed = ['canvas', 'surface', 'text', 'accent', 'onAccent']
    missing = [k for k in needed if k not in tokens]
    if missing:
        raise ValueError('For --html preview, define tokens: ' + ', '.join(missing))
    c = {k: html.escape(v, quote=True) for k,v in tokens.items()}
    name = html.escape(str(spec.get('name', 'Palette preview')))
    muted = c.get('mutedText', c['text'])
    strips = ''.join(f'<div class="swatch" style="background:{color}"><strong>{html.escape(key)}</strong><small>{html.escape(color)}</small></div>' for key,color in tokens.items())
    checks = ''.join(f'<tr><td>{html.escape(x["foreground"])} on {html.escape(x["background"])}</td>'
                     f'<td>{x["ratio"]:.2f}:1</td><td>{html.escape(x["use"])}</td>'
                     f'<td>{"PASS" if x["pass"] else "FAIL"}</td></tr>' for x in report['pair_results'])
    return f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name} — attention hierarchy preview</title>
<style>
:root{{--canvas:{c['canvas']};--surface:{c['surface']};--text:{c['text']};--muted:{muted};--accent:{c['accent']};--on-accent:{c['onAccent']}}}
*{{box-sizing:border-box}}body{{background:var(--canvas);color:var(--text);font:16px/1.5 system-ui,sans-serif;margin:0}}
main{{max-width:980px;margin:auto;padding:clamp(20px,6vw,72px)}}nav{{display:flex;justify-content:space-between;align-items:center;gap:16px}}
small,.muted{{color:var(--muted)}}h1{{font-size:clamp(36px,7vw,64px);line-height:1.04;letter-spacing:-.035em;max-width:13ch;margin:70px 0 20px}}
.intro{{max-width:53ch;font-size:20px}}.button{{display:inline-block;background:var(--accent);color:var(--on-accent);font-weight:750;border-radius:10px;text-decoration:none;padding:15px 22px;margin:18px 0 58px}}
.button:focus-visible{{outline:3px solid var(--text);outline-offset:3px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}}
.card{{padding:26px;border-radius:14px;background:var(--surface)}}.card h2{{font-size:19px;margin:0 0 8px}}.card p{{margin:0}}
.swatches{{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:20px 0}}.swatch{{min-height:100px;padding:12px;border:1px solid #777;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;text-shadow:0 1px 3px #000,0 0 3px #000}}
.swatch small{{color:inherit}}table{{border-collapse:collapse;width:100%;font-size:14px}}td,th{{padding:9px;border-bottom:1px solid #999;text-align:left}}
@media(prefers-reduced-motion:no-preference){{.button{{transition:transform .15s ease}}.button:hover{{transform:translateY(-2px)}}}}
</style>
<main><nav><strong>Product example</strong><span class="muted">Overview &nbsp; Learn &nbsp; About</span></nav>
<h1>The important action should be obvious.</h1><p class="intro">This page demonstrates two supporting surface roles and one primary accent, without filling every card with the loud color.</p>
<a class="button" href="#checks">Try the main action</a>
<section class="grid"><article class="card"><h2>Clear structure</h2><p>Related details have a quiet foundation.</p></article>
<article class="card"><h2>Measured emphasis</h2><p>One CTA gets the strongest visual treatment.</p></article>
<article class="card"><h2>Purpose first</h2><p>A palette cannot replace meaningful content.</p></article></section>
<h2 style="margin-top:65px">Palette tokens</h2><div class="swatches">{strips}</div>
<h2 id="checks">Defined contrast checks</h2><table><tr><th>Pair</th><th>Ratio</th><th>Use</th><th>Result</th></tr>{checks}</table>
<p class="muted">Example visualization only; swatch labels use a high-contrast halo for display. Verify real products at final sizes, states, and devices.</p></main></html>'''


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--spec', required=True, help='JSON file specifying tokens and real display pairs')
    p.add_argument('--json', help='Write machine-readable findings')
    p.add_argument('--html', help='Write static preview with semantic roles')
    p.add_argument('--strict', action='store_true', help='Exit 2 when a required contrast pair fails')
    args = p.parse_args()
    try:
        spec = json.loads(Path(args.spec).read_text(encoding='utf-8'))
        report = analyze(spec)
        if args.json:
            Path(args.json).write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        if args.html:
            Path(args.html).write_text(render_html(spec, report), encoding='utf-8')
        print(f'{report["name"]}: {report["passed_pairs"]} pass, {report["failed_pairs"]} fail')
        for x in report['pair_results']:
            result = 'PASS' if x['pass'] else 'FAIL'
            print(f' {result:4s} {x["foreground"]} on {x["background"]}: {x["ratio"]:.2f}:1 ({x["use"]} >= {x["minimum"]}:1)')
        print('Not a complete accessibility audit; inspect usage, imagery, states and users.')
        return 2 if args.strict and report['failed_pairs'] else 0
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as err:
        p.error(str(err))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
