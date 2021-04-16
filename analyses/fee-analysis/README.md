# Fee analysis

This directory has a CLI to output the analysis of weights into a `CSV` and a more interactive notebook



## Requirements

* python >= 3.9
* (virtualenv)[https://pypi.org/project/virtualenv/]

## Steps to run
* `virtualenv .venv`
* `source .venv/bin/activate`
* `pip install -r requirements.txt`
* `jupyter notebook`
* a browser tab should launch with the files in this directory

## To run the CLI
This CLI will output a CSV with the weights of the extrinsics given a file or directory with files that are output by
the FRAME benchmarks.
Furthermore, given the parameters in a configuration file it will calculate the token fees for the given
weights.

Moreover, it can optionally try to estimate the price in fiat currency of the extrinsics given the total issuance of tokens in
the system and the market cap.

* `python analysis_cli --help` will output the help

You will need to provide a path to a directory containing the weight files or the path to a single
weight file.

By default the output will be in `output.csv` where the cli is run, to change this use the `-o` option.

For the CSV to include an analysis pass the parameter `-p` (Meaning the calculated price in tokens and prices)

The parameter configurations is found in `config.json` in the `analysis_cli` directory, you can change the file using
the `-c` option.

The config file has the following form:

```json
{
    "weight_coefficient": Number,
    "issuance": Number,
    "length_coefficient": Number,
    "min_market_cap": Number,
    "max_market_cap": Number,
    "lengths": {
        "<extrinsic_name>": Number
    },
    "params": {
        "<extrinsic_name>": {
            "i": Number,
            "j": Number,
            "k": Number,
            ...
        }
    }
}
```

Where:
* `weight_coefficient`: is the coefficient for converting a weight to a token fee, this can be found in
  `runtime/src/constants.rs` as part of the `WeightToFeePolynomial` implementation by `WeightToFee`.
* `issuance`: The total number of tokens available in the system, this is found in `runtime/src/constants.rs` as `JOYS`.
* `length_coefficient`: This is how much a byte of an extrinsic cost in number of tokens, this is found in
  `runtime/src/constants.rs` as `TransactionByteFee`.
* `min_market_cap`: This is the estimated minimum market cap of the token. This is only used when the dollar price of a
  extrinsics is calculated.
* `max_market_cap`: This is the estimated maximum market cap of the token. This is only used when the dollar price of a
  extrinsics is calculated.
* `lengths`: This is a dictionary containing `<extrinsic_name>`. This entries maps to a length in bytes for a given
  extrinsic. When calculating the token fee of an extrinsic this will be added over its weight fee using
  `length_coefficient` for the convertion. (It's specially important to set a length for `runtime_upgrade` since this
  extrinsic can easily take up to 3MB in size which will make a considerable part of its cost.
* `params`: This is a dictionary of dictionaries, each entry on the first level represent a different extrinsic with
  `<extrinsic_name>`. Each of these entries are a dictionary with `<parameter>` that represent a value of a parameter
  that will be used when calculating the weight of the extrinsic with its corresponding function.

Note that the `<extrinsic_name>` need its fully qualified path, e.g. `proposals_discussion::add_post`.

Currently the `weight_coefficient` and the `length_coefficient` is set to the same as the runtime.

**Note:** The output csv file already sums the `EXTRINSIC_BASE_WEIGHT` to the weight column

## To run the notebook

* open `main_notebook.ipynb`
* The notebook has the information on how to proceed
