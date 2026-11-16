"""Offline behavioral tests; do not contact GitHub or modify real repositories."""
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import github_discover as gd


def repo(name, **kwargs):
    return dict(full_name=name, description='', updated_at='2026-11-15T00:00:00Z', **kwargs)


def fake(pages):
    calls = []
    def request(host, endpoint):
        calls.append((host, endpoint))
        if endpoint == 'user':
            return {'login': 'signed-in-user'}
        return pages[int(endpoint.rsplit('=', 1)[1]) - 1]
    return request, calls


class DiscoveryTests(unittest.TestCase):
    def test_identity_scope_and_exact_ranking(self):
        fetch, calls = fake([[repo('a/portfolio-tools'), repo('b/portfolio', private=True)]])
        result = gd.discover(query='portfolio', request=fetch)
        self.assertEqual(result['authenticated_user'], 'signed-in-user')
        self.assertEqual(result['candidates'][0]['repository'], 'b/portfolio')
        self.assertEqual(result['candidates'][0]['visibility'], 'private')
        self.assertTrue(result['enumeration_complete'])
        self.assertEqual(len(calls), 2)

    def test_pagination_and_owner_filter(self):
        fetch, _ = fake([[repo(f'other/project-{i}') for i in range(100)], [repo('Mine/needle')]])
        result = gd.discover(query='needle', owner='mine', request=fetch)
        self.assertEqual(result['pages_read'], 2)
        self.assertEqual(result['candidates'][0]['repository'], 'Mine/needle')

    def test_page_cap_does_not_claim_absence(self):
        fetch, _ = fake([[repo(f'a/repo-{i}') for i in range(100)]])
        result = gd.discover(query='missing', max_pages=1, request=fetch)
        self.assertFalse(result['enumeration_complete'])
        self.assertEqual(result['candidates'], [])

    def test_bounded_output_and_duplicate_pages(self):
        fetch, _ = fake([[repo(f'a/repo-{i}') for i in range(100)], [repo('a/repo-1')]])
        result = gd.discover(limit=3, request=fetch)
        self.assertEqual(result['repositories_scanned'], 100)
        self.assertEqual(len(result['candidates']), 3)
        self.assertTrue(result['results_truncated'])

    def test_query_is_local_data(self):
        query = '$(touch /tmp/never)'
        fetch, calls = fake([[repo('a/safe')]])
        gd.discover(query=query, request=fetch)
        self.assertTrue(all(query not in endpoint for _, endpoint in calls))

    def test_get_only_and_no_shell(self):
        with patch.object(gd.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, '{"login":"me"}', '')) as run:
            self.assertEqual(gd.api('github.com', 'user')['login'], 'me')
            args, kwargs = run.call_args
            self.assertEqual(args[0], ['gh', 'api', '--hostname', 'github.com', '--method', 'GET', 'user'])
            self.assertFalse(kwargs.get('shell', False))
            self.assertEqual(kwargs['env']['GH_PROMPT_DISABLED'], '1')

    def test_raw_error_does_not_leak(self):
        with patch.object(gd.subprocess, 'run', return_value=subprocess.CompletedProcess([], 1, '', 'secret-token-example')):
            with self.assertRaises(gd.DiscoveryError) as raised:
                gd.api('github.com', 'user')
            self.assertNotIn('secret-token-example', str(raised.exception))

    def test_missing_cli_and_timeout(self):
        for error in [FileNotFoundError(), subprocess.TimeoutExpired('gh', 30)]:
            with patch.object(gd.subprocess, 'run', side_effect=error):
                with self.assertRaises(gd.DiscoveryError):
                    gd.api('github.com', 'user')

    def test_bad_response_and_host(self):
        for host in ['https://github.com', '-evil', 'user:secret@github.com', 'github.com/path']:
            with self.assertRaises(gd.DiscoveryError):
                gd.discover(host=host)
        with self.assertRaises(gd.DiscoveryError):
            gd.discover(request=lambda *_: {'error': 'auth failed'})
        fetch, _ = fake([[{'unexpected': True}]])
        with self.assertRaises(gd.DiscoveryError):
            gd.discover(request=fetch)

    def test_archived_forks_remain_visible_not_selected(self):
        fetch, _ = fake([[repo('a/site', archived=True, fork=True)]])
        result = gd.discover(query='site', request=fetch)
        self.assertTrue(result['candidates'][0]['archived'])
        self.assertTrue(result['candidates'][0]['fork'])
        self.assertNotIn('selected_repository', result)


if __name__ == '__main__':
    unittest.main()
