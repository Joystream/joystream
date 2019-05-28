/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict';

/*
 * Checks that the parameter is an Option without a value
 */
function isNullOption(value)
{
  const { Option } = require('@polkadot/types/codec');
  if (!(value instanceof Option)) {
    return false;
  }

  if (!value.raw) {
    return false;
  }

  const { Null } = require('@polkadot/types/primitive');
  if (value.raw instanceof Null) {
    return true;
  }
  return false;
}

module.exports = {
  isNullOption: isNullOption,
};
