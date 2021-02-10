# Fee analysis

This directory has a CLI to output the analysis of weights into a `CSV` and a more interactive notebook



## Requirements

* python3
* (virtualenv)[https://pypi.org/project/virtualenv/]

## Steps to run
* `virtualenv .venv`
* `source .venv/bin/activate`
* `pip install -r requirements.txt`
* `jupyter notebook`
* a browser tab should launch with the files in this directory

## To run the CLI
* `python analysis_cli --help` will output the help

You will need to provide a path to a directory containing the weight files or the path to a single
weight file.

For the CSV to include an analysis pass the parameter `-p` (Meaning the calculated price in tokens and prices)

The `config.json` file in the `analysis_cli` there is configuration for said analysis. Such as specializing the
parametrs and length for a given extrinsics, the coefficients, issuance and marke caps.

**Note:** The output csv file already sums the `EXTRINSIC_BASE_WEIGHT` to the weight column

## To run the notebook

* open `main_notebook.ipynb`
* The notebook has the information on how to proceed
