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
 * Currently a mock; do something real with it TODO
 */
class DHT
{
  constructor(address_map)
  {
    this.address_map = address_map;
    // TODO get address map from DHT
  }

  resolve(pubkey, callback)
  {
    for (var i = 0 ; i < this.address_map.length ; ++i) {
      const item = this.address_map[i];
      console.log(item, pubkey);
      if (pubkey == item[0]) {
        callback(null, item[1]);
        return;
      }
    }
    callback(new Error(`Cannot resolve "${pubkey}"!`));
  }
}

module.exports = {
  DHT: DHT,
}
