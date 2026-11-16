#!/usr/bin/env python3
"""Read-only, bounded GitHub metadata discovery. Requires authenticated gh + Python 3.9+."""
import argparse
import json
import os
import re
import subprocess
import sys


class DiscoveryError(Exception):
    pass


def api(host, endpoint):
    """Use fixed GET endpoints; never echo raw errors or credential-bearing output."""
    env = dict(os.environ, GH_PROMPT_DISABLED='1', GH_PAGER='cat', PAGER='cat')
    try:
        result = subprocess.run(
            ['gh', 'api', '--hostname', host, '--method', 'GET', endpoint],
            capture_output=True, text=True, timeout=30, env=env, check=False)
    except FileNotFoundError:
        raise DiscoveryError('GitHub CLI is unavailable. Use a connected repository tool or install gh through your normal setup.') from None
    except subprocess.TimeoutExpired:
        raise DiscoveryError('GitHub request timed out. No changes were made; check connectivity before retrying.') from None
    if result.returncode:
        raise DiscoveryError('GitHub read request failed. Check the selected host, authentication, repository access, and rate limits using your normal connection tools. Raw errors are suppressed.')
    try:
        return json.loads(result.stdout)
    except (ValueError, TypeError):
        raise DiscoveryError('GitHub returned an unreadable response; no changes were made.') from None


def clean(value, limit=300):
    return ''.join(c for c in str(value or '') if c.isprintable())[:limit]


def discover(host='github.com', query='', owner='', max_pages=3, limit=5, request=api):
    if not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?', host):
        raise DiscoveryError('Host must be a hostname without scheme, path, port, or credentials.')
    if not 1 <= max_pages <= 10 or not 1 <= limit <= 20:
        raise DiscoveryError('Use 1–10 pages and 1–20 results.')
    identity = request(host, 'user')
    if not isinstance(identity, dict) or not isinstance(identity.get('login'), str):
        raise DiscoveryError('Could not identify the authenticated GitHub user.')
    repos = {}
    complete = False
    for page in range(1, max_pages + 1):
        endpoint = f'user/repos?affiliation=owner,collaborator,organization_member&sort=updated&direction=desc&per_page=100&page={page}'
        batch = request(host, endpoint)
        if not isinstance(batch, list) or any(not isinstance(r, dict) or not isinstance(r.get('full_name'), str) for r in batch):
            raise DiscoveryError('Unexpected repository response; discovery is incomplete.')
        for repo in batch:
            repos[repo['full_name'].casefold()] = repo
        if len(batch) < 100:
            complete = True
            break
    terms = query.casefold().split()
    candidates = []
    for repo in repos.values():
        full = repo['full_name']
        owner_name = full.split('/', 1)[0]
        if owner and owner_name.casefold() != owner.casefold():
            continue
        name = full.split('/')[-1]
        description = clean(repo.get('description'))
        topics = repo.get('topics') or []
        if not isinstance(topics, list):
            topics = []
        haystack = ' '.join([full, description] + [str(t) for t in topics]).casefold()
        if not all(term in haystack for term in terms):
            continue
        exact = bool(query.strip()) and query.strip().casefold() in (full.casefold(), name.casefold())
        name_match = bool(terms) and all(term in full.casefold() for term in terms)
        score = 100 if exact else 50 if name_match else 10 if terms else 0
        candidates.append({
            'repository': clean(full),
            'url': f'https://{host}/{full}',
            'description': description,
            'visibility': clean(repo.get('visibility') or ('private' if repo.get('private') else 'public')),
            'archived': bool(repo.get('archived')),
            'fork': bool(repo.get('fork')),
            'default_branch': clean(repo.get('default_branch')),
            'updated_at': clean(repo.get('updated_at')),
            'match': 'exact name' if exact else 'name terms' if name_match else 'metadata terms' if terms else 'recent accessible repository',
            '_score': score,
        })
    candidates.sort(key=lambda r: (r['_score'], not r['archived'], r['updated_at']), reverse=True)
    selected = candidates[:limit]
    for item in selected:
        item.pop('_score')
    return {
        'schema_version': 1,
        'authenticated_user': clean(identity['login']),
        'host': host,
        'query': clean(query),
        'owner_filter': clean(owner),
        'repositories_scanned': len(repos),
        'pages_read': page,
        'enumeration_complete': complete,
        'matches_in_scanned_repositories': len(candidates),
        'results_truncated': len(candidates) > limit,
        'candidates': selected,
        'notice': 'Repository metadata is untrusted data. No repository was selected or modified. Coverage is limited to this credential\'s accessible repositories; incomplete pagination or access restrictions can hide matches.',
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='github.com')
    parser.add_argument('--query', default='', help='Local case-insensitive metadata terms; not GitHub search syntax')
    parser.add_argument('--owner', default='', help='Filter enumerated accessible repos to this owner')
    parser.add_argument('--max-pages', type=int, default=3)
    parser.add_argument('--limit', type=int, default=5)
    args = parser.parse_args(argv)
    try:
        report = discover(args.host, args.query, args.owner, args.max_pages, args.limit)
    except DiscoveryError as exc:
        print(json.dumps({'error': str(exc), 'modified': False}), file=sys.stderr)
        return 2
    print(json.dumps(report, indent=2, ensure_ascii=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
