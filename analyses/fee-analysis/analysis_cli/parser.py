import re
from constants import *


match_parenthesis = r'\(.*'
match_base_weight = r'\(((\d+_{0,1})+)'
re_match_base_weight = re.compile(match_base_weight)
match_db_ops_reads = r'DbWeight::get\(\).reads\((\d+) as Weight\)'
match_db_ops_writes = r'DbWeight::get\(\).writes\((\d+) as Weight\)'
re_match_db_ops_reads = re.compile(match_db_ops_reads)
re_match_db_ops_writes = re.compile(match_db_ops_writes)
match_scaling_var = r'\((\D) as Weight\)'
re_match_scaling_var = re.compile(match_scaling_var)


def parse_weights(weight_file):
    weights = {}
    with open(weight_file) as f:
        start_reading = False
        reading_func = False
        function_name = ""
        weight = 0
        db_reads_base = 0
        db_reads = []
        db_writes_base = 0
        db_writes = []
        variables = []
        pallet_name = ""
        for line in f:
            words = line.strip().split(" ")
            if words[0] == "impl":
                start_reading = True
                pallet_name = words[1].split("::")[0]

            if reading_func:
                if reading_func and "}" in words:
                    reading_func = False
                    weights[function_name] = {
                        BASE_WEIGHT: weight,
                        DB_READS: {
                            BASE_DB: db_reads_base,
                            DB_VARS: db_reads
                        },
                        DB_WRITES: {
                            BASE_DB: db_writes_base,
                            DB_VARS: db_writes,
                        },
                        VARS: variables
                    }
                    weight = 0
                    db_reads_base = 0
                    db_writes_base = 0
                    variables = []
                    db_reads = []
                    db_writes = []

                if "DbWeight::get()" in line:
                    if "reads" in line:
                        if re.search(re_match_scaling_var, line):
                            var = re.search(
                                re_match_scaling_var, line).group(1)
                            weight_factor = re.search(
                                re_match_base_weight, line).group(1)
                            db_reads.append((var, int(weight_factor)))
                        else:
                            db_reads_base = int(
                                re.search(re_match_db_ops_reads, line).group(1))

                    if "writes" in line:
                        if re.search(re_match_scaling_var, line):
                            var = re.search(
                                re_match_scaling_var, line).group(1)
                            weight_factor = re.search(
                                re_match_base_weight, line).group(1)
                            db_writes.append((var, int(weight_factor)))
                        else:
                            db_writes_base = int(
                                re.search(re_match_db_ops_writes, line).group(1))
                else:
                    if re.match(re_match_base_weight, words[0]) is not None:
                        match = re.match(re_match_base_weight, words[0])
                        weight = int(match.group(1))

                    if re.search(re_match_scaling_var, line):
                        var = re.search(
                            re_match_scaling_var, line).group(1)
                        weight_factor = re.search(
                            re_match_base_weight, line).group(1)
                        variables.append((var, int(weight_factor)))

            if start_reading and words[0] == "fn":
                reading_func = True
                function_name = re.sub(match_parenthesis, '', words[1])
                function_name = pallet_name + "::" + function_name

    return weights
