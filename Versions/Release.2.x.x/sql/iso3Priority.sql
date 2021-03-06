DROP TABLE IF EXISTS ISO3Priority;
CREATE TABLE ISO3Priority (
  iso3 TEXT NOT NULL PRIMARY KEY REFERENCES Language(iso3),
  country TEXT NOT NULL,
  pop REAL NOT NULL,
  comment TEXT NULL);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('acm', 'IQ', 11.5, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('aec', 'EG', 18.9, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('afb', 'IQ', 0.04, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('apd', 'SD', 15.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('arb', '*', 206.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ary', 'MA', 18.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ayp', 'IQ', 5.4, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('shu', 'TD', 0.7, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('aym', 'PE', 1.0, 'Pop is a guess');
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ayr', 'BO', 1.7, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('azb', 'IR', 23.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('aze', 'AZ', 6.0, 'macro? Pop is a guess');
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('azj', 'AZ', 6.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ffm', 'ML', 0.9, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fub', 'CM', 0.6, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fuc', 'SN', 2.4, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fue', 'BJ', 0.28, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fuf', 'GN', 2.5, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fuh', 'NE', 0.4, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fuq', 'NE', 0.45, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('fuv', 'NG', 1.7, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gnw', 'BO', 0.007, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gug', 'PY', 4.6, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gui', 'BO', 0.03, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gun', 'BR', 0.005, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('kng', 'CD', 1.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ldi', 'CG', 0.09, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('min', 'ID', 6.5, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('pse', 'ID', 0.4, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('urk', 'TH', 0.003, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('xmm', 'ID', 0.8, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('zlm', 'MY', 7.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ojb', 'CA', 0.02, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ojs', 'CA', 0.008, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gax', 'ET', 3.6, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('gaz', 'ET', 8.9, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('hae', 'ET', 4.2, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ori', 'IN', 31.6, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('ory', '*', 1.0, 'new no data, Pop is guess');
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qub', 'PE', 0.04, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('quf', 'PE', 0.02, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qug', 'EC', 1.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('quh', 'BO', 2.7, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qul', 'BO', 0.1, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qup', 'PE', 0.001, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('quw', 'EC', 0.005, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('quy', 'PE', 0.9, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('quz', 'PE', 1.5, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qva', 'PE', 0.09, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvc', 'PE', 0.03, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qve', 'PE', 0.2, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvh', 'PE', 0.07, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvi', 'EC', 0.3, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvm', 'PE', 0.08, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvn', 'PE', 0.06, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvo', 'PE', 0.01, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvs', 'PE', 0.01, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvw', 'PE', 0.2, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qvz', 'EC', 0.004, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qwh', 'PE', 0.3, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qxh', 'PE', 0.05, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qxl', 'EC', 0.01, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qxn', 'PE', 0.2, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qxo', 'PE', 0.25, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('qxr', 'EC', 0.1, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('als', 'AL', 2.9, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('sqi', '*', 2.9, 'macro? Pop is guess, how decide which is best');
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('swc', 'CD', 0.001, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('swh', 'TZ', 0.5, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('cmn', 'CN', 867.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('czh', 'CN', 4.6, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('hak', 'CN', 25.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('nan', 'CN', 25.0, null);
INSERT INTO ISO3Priority (iso3, country, pop, comment) VALUES ('yue', 'CN', 52.0, null);
