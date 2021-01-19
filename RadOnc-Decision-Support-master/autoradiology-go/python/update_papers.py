import requests
import json
import sys
import time
LOCALHOST = '0.0.0.0'
GCP = '34.74.246.237'


def main(ip):
    url = f'http://{ip}:8088/update-paper-data'

    site_stage = {
        'Breast': ['DCIS-LCIS', 'I-IIB(± T3 N0)'],
#        'Central Nervous System': ['Acoustic Neuroma', 'Arteriovenous Malformation', 'Trigeminal Neuralgia'],
#        'Non-small Cell Lung': ['I-II', 'Typical chemo', 'Superior sulcus', 'IIIA', 'IIIB'],
    }

    for site, stages in site_stage.items():
        for stage in stages:
            print(f"Getting {site}, {stage}...")
            post_r = json.dumps({'site': site, 'stage': stage})
            r = requests.post(url, post_r)
            if not r.ok:
                sys.stderr.write(f'Error in {site}, {stage}')
            else:
                print(r.content)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.stderr.write('Error: no host provided supply gcp or local')
        sys.exit(1)

    if sys.argv[1].lower() == 'local':
        ip = LOCALHOST
    elif sys.argv[1].lower() == 'gcp':
        ip = GCP

    main(ip)
