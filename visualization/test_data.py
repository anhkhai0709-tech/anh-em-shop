import unittest
import pandas as pd
from data import prepare_events


class EventFilters(unittest.TestCase):
    def test_only_recent_real_group07_pageviews_are_counted_once(self):
        now = pd.Timestamp('2026-10-19T12:00:00Z')
        cases = [('07', now, {'event_id': 'a'}), ('07', now, {'event_id': 'a'}),
                 ('01', now, {}), ('07', now - pd.Timedelta(hours=25), {}),
                 ('07', now + pd.Timedelta(seconds=1), {}),
                 ('07', now, {'test': True}), ('07', now, {'event': 'click'}),
                 ('07', now, {'site': 'another-site'})]
        frame = pd.DataFrame([dict(id=g, time=t, meta=m, country='VN', device='ios', ip='')
                              for g, t, m in cases])
        self.assertEqual(len(prepare_events(frame, now=now)), 1)

    def test_epoch_milliseconds_and_timezone(self):
        now = pd.Timestamp('2026-10-19T12:00:00Z')
        frame = pd.DataFrame([dict(id='07', time=now.value // 1000000,
                                  country='VN', device='ios', ip='')])
        self.assertEqual(len(prepare_events(frame, now=now)), 1)


if __name__ == '__main__':
    unittest.main()
