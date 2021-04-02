import pandas as pd
from constants import *


def weight_to_fee(weight, coeff):
    return coeff * weight


def length_to_fee(length, coeff):
    return coeff * length


def token_to_price(token, market_cap, issuance):
    return (market_cap / issuance) * token


def price_weight_function(x, weight_coefficient, market_cap, issuance):
    return token_to_price(weight_to_fee(x, weight_coefficient), market_cap, issuance)


def price_length_function(x, length_coefficient, market_cap, issuance):
    return token_to_price(length_to_fee(x, length_coefficient), market_cap, issuance)


def print_var_err(var, extrn):
    print("WARNING: the parameter {} isn't defined in the calculation for extrinsic: {}".format(
        var[0], extrn))


def calc_vars_weight(weight, extrinsic, params):
    total = 0
    if extrinsic in params:
        for var in weight[VARS]:
            if var[0] in params[extrinsic]:
                total += params[extrinsic][var[0]] * var[1]
            else:
                print_var_err(var, extrinsic)
        for var in weight[DB_READS][DB_VARS]:
            if var[0] in params[extrinsic]:
                total += params[extrinsic][var[0]] * var[1] * READ_WEIGHT
            else:
                print_var_err(var, extrinsic)
        for var in weight[DB_WRITES][DB_VARS]:
            if var[0] in params[extrinsic]:
                total += params[extrinsic][var] * WRITE_WEIGHT
            else:
                print_var_err(var, extrinsic)
    return total


def calc_weight(weight, extrinsic, params):
    vars_weight = calc_vars_weight(weight, extrinsic, params)
    return vars_weight + \
        weight[BASE_WEIGHT] + \
        weight[DB_READS][BASE_DB] * READ_WEIGHT + \
        weight[DB_WRITES][BASE_DB] * WRITE_WEIGHT + EXTRINSIC_BASE_WEIGHT


def calc_total_price_given_params(extrinsic, weight_coeff, market_cap, issuance, length_coeff, params, lengths, weights):
    return price_weight_function(calc_weight(weights[extrinsic], extrinsic, params), weight_coeff, market_cap, issuance) + \
        price_length_function(lengths.get(extrinsic, 0),
                              length_coeff, market_cap, issuance)


def calc_total_fee(extrinsic, weight_coeff, length_coeff, params, lengths, weights):
    return weight_to_fee(calc_weight(weights[extrinsic], extrinsic, params), weight_coeff) + \
        length_to_fee(lengths.get(extrinsic, 0), length_coeff)


def get_computed_values(
    extrinsic,
    weight_model,
    weight_coeff,
    min_market_cap,
    max_market_cap,
    issuance,
    length_coeff,
    params,
    lengths,
    weights
):
    weight = calc_weight(weight_model, extrinsic, params)
    tokens = calc_total_fee(extrinsic, weight_coeff,
                            length_coeff, params, lengths, weights)
    min_price = calc_total_price_given_params(
        extrinsic,
        weight_coeff,
        min_market_cap,
        issuance,
        length_coeff,
        params,
        lengths,
        weights
    )
    max_price = calc_total_price_given_params(
        extrinsic,
        weight_coeff,
        max_market_cap,
        issuance,
        length_coeff,
        params,
        lengths,
        weights
    )
    return weight, tokens, min_price, max_price


def calc_all_price(weight_coeff, issuance, length_coeff, min_market_cap, max_market_cap, weights, params, lengths):
    names = []
    computed_weights = []
    computed_tokens = []
    min_prices = []
    max_prices = []
    for (key, val) in weights.items():
        weight, tokens, min_price, max_price = get_computed_values(
            key,
            val,
            weight_coeff,
            min_market_cap,
            max_market_cap,
            issuance,
            length_coeff,
            params,
            lengths,
            weights
        )
        names.append(key)
        computed_weights.append(weight)
        min_prices.append(min_price)
        max_prices.append(max_price)
        computed_tokens.append(tokens)

    weight_table = {
        "Extrinsic": names,
        "Weight": computed_weights,
        "Tokens(JOY)": computed_tokens,
        "Min Price(¢)": min_prices,
        "Max Price(¢)": max_prices
    }
    df = pd.DataFrame(weight_table)

    return df, min_prices, max_prices


def get_weight_info(weights, weight_coeff=1, issuance=1, length_coeff=1, min_market_cap=1, max_market_cap=1, params={},
                    lengths={}):
    weights[RUNTIME_UPGRADE] = {
        BASE_WEIGHT: MAX_BLOCK_WEIGHT,
        DB_READS: {
            BASE_DB: 0,
            DB_VARS: []
        },
        DB_WRITES: {
            BASE_DB: 0,
            DB_VARS: []
        },
        VARS: []

    }

    df, _, _ = calc_all_price(
        weight_coeff,
        issuance,
        length_coeff,
        min_market_cap,
        max_market_cap,
        weights,
        params,
        lengths,
    )

    return df
