"""Run: python -m unittest discover -s tests -v"""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import palette_probe as pp


class ContrastTests(unittest.TestCase):
    def test_known_extremes(self):
        self.assertAlmostEqual(pp.contrast_ratio('#000000', '#ffffff'), 21.0, places=6)
        self.assertAlmostEqual(pp.contrast_ratio('#ffffff', '#fff'), 1.0, places=6)

    def test_medium_gray_threshold(self):
        ratio = pp.contrast_ratio('#777777', '#ffffff')
        self.assertLess(ratio, 4.5)
        self.assertGreater(ratio, 3.0)

    def test_invalid_hex(self):
        for s in ['red', '#abcde', '#xyz', '', 'ffffff']:
            with self.assertRaises(ValueError):
                pp.parse_hex(s)

    def test_fail_is_not_ignored(self):
        spec = {'tokens': {'fg':'#ffffff','bg':'#ffffff'},
                'pairs': [{'foreground':'fg','background':'bg','use':'normal-text'}]}
        r = pp.analyze(spec)
        self.assertEqual(r['failed_pairs'],1)
        self.assertFalse(r['pair_results'][0]['pass'])

    def test_example_all_declared_pairs_pass(self):
        import json
        p = Path(__file__).resolve().parents[1] / 'assets' / 'color-tokens-example.json'
        r = pp.analyze(json.loads(p.read_text(encoding='utf-8')))
        self.assertEqual(r['failed_pairs'],0, r)

    def test_unknown_token_fails(self):
        with self.assertRaises(ValueError):
            pp.analyze({'tokens': {'fg':'#fff'},
                        'pairs': [{'foreground':'fg','background':'missing','use':'normal-text'}]})

if __name__ == '__main__':
    unittest.main()
