from proto.extractTables import extracted_tables_pb2 as P_table
from bs4 import BeautifulSoup
import pandas as pd
import requests

def get_source(target_url):
    r = requests.get(target_url)
    return(r.content)

def extract_tables(html_source):
    soup = BeautifulSoup(html_source)
    tables = soup.find_all("table")

    return tables

def parse_tables(tables):
    table_protos = []
    for table in tables:
        table_protos.extend([parse_table(table)])

    return table_protos

def parse_table(table):
    table_proto = P_table.Table()
    headings = [
        th.get_text().strip() for th in table.find("tr").find_all("th")]
    data_rows = []
    for row in table.find_all("tr")[1:]:
        data_rows.append(
            dict(zip(headings, (td.get_text() for td in row.find_all("td")))))

    for col_label in headings:
        col_proto = P_table.Column()
        col_proto.header = col_label
        col_data = []
        for d in data_rows:
            try:
                 col_data.append(d[col_label])
            except KeyError:
                return table_proto
        col_proto.cell_data.extend(col_data)
        table_proto.data_col.extend([col_proto])

    return table_proto

def convert_to_df(table_proto):
    headers = (col.header for col in table_proto.data_col)
    table_df = pd.DataFrame(columns=headers)

    for col in table_proto.data_col:
        table_df[col.header] = col.cell_data[:]

    return table_df

    