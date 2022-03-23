from parser import parse_weights
from pathlib import Path
import pathlib
import argparse
from os import listdir
import os
from analysis import get_weight_info
import json


def main():
    arg_parser = argparse.ArgumentParser(description="Fee analysis")
    arg_parser.add_argument(
        'weight_path', type=str, help='Path to weight files or directory with weights'
    )
    arg_parser.add_argument('-o', '--output', type=str,
                            help='Path for csv file defaults to output.csv', default="output.csv")
    arg_parser.add_argument('-c', '--config', type=str,
                            help='Path of a config file', default=Path(__file__).parent / "config.json")
    arg_parser.add_argument('-p', '--process-data', action='store_true',
                            help='Process data given a config if not used only weights will be dumped into the csv output')

    args = arg_parser.parse_args()
    weight_path = args.weight_path
    output_file = args.output
    config_file = args.config
    process_data = args.process_data

    with open(config_file) as f:
        config = json.load(f)

    weight_coeff = config.get("weight_coefficient", 0)
    issuance = config.get("issuance", 0)
    length_coeff = config.get("length_coefficient", 0)
    min_market_cap = config.get("min_market_cap", 0)
    max_market_cap = config.get("max_market_cap", 0)
    lengths = config.get("lengths", {})
    params = config.get("params", {})

    w = {}

    if os.path.isdir(weight_path):
        for f in listdir(weight_path):
            path = weight_path + f
            if os.path.isfile(path):
                w |= parse_weights(weight_path + f)
    elif os.path.isfile(weight_path):
        w = parse_weights(weight_path)
    else:
        print("Error: ", weight_path, " is not a valid directory or file")

    df = get_weight_info(w, weight_coeff, issuance,
                         length_coeff, min_market_cap, max_market_cap, params, lengths)
    if process_data:
        df.to_csv(output_file, index=False, )
    else:
        df.to_csv(output_file, index=False, columns=["Extrinsic", "Weight"])


if __name__ == '__main__':
    main()
