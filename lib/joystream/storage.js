'use strict';

const DEFAULT_POOL_SIZE = 1024;

const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');

const debug = require('debug')('joystream:storage');

const repository = require.main.require('joystream/repository');
const lru = require.main.require('util/lru');

/*
 * Manages multiple storage repositories.
 *
 * - A common file system root contains all repositories.
 * - Keeps a LRU pool of Repository instances, so that we can manage memory
 *   consumption better.
 */
class Storage
{
  constructor(base_path, pool_size = DEFAULT_POOL_SIZE, use_fs = false)
  {
    this.base_path = path.resolve(base_path);
    this.pool_size = pool_size;
    this.pool = new lru.LRUCache(this.pool_size);
    this.use_fs = use_fs;

    this.id = this._initialize();
    debug('Initialized storage', this.id, 'at', this.base_path, 'with LRU of', this.pool_size);
  }


  /*
   * Return a Repository instance for the repo with the given ID
   */
  get(id)
  {
    // Return from pool if it exists.
    if (this.pool.has(id)) {
      debug('Return repo', id, 'from LRU cache.');
      return this.pool.get(id);
    }

    // Check if there is a path for this id.
    const repo_path = this._path_for_repo(id);
    if (!fs.existsSync(repo_path)) {
      debug('Repo', id, 'does not exist at path:', repo_path);
      return undefined;
    }

    var repo = new repository.Repository(repo_path, this.use_fs);
    this.pool.put(id, repo);
    return repo;
  }


  /*
   * Create a repository. Return the id and repository in an object.
   */
  create()
  {
    // Make repo ID globally unique by using the storage ID as a namespace.
    // This assumes storage IDs are globally unique, but since they're much
    // less common, that's significantly more likely (then again, UUIDv4
    // should already be unique enough...)
    const id = uuidv5(uuidv4(), this.id);
    const repo_path = this._path_for_repo(id);

    // Just for paranoia, though, let's ensure the repo path does not exist.
    if (fs.existsSync(repo_path)) {
      throw new Error(`Repository ${id} at path "${repo_path}" already exists, aborting!`);
    }

    const repo = new repository.Repository(repo_path, this.use_fs);
    this.pool.put(id, repo);
    return {
      id: id,
      repo: repo,
    }
  }


  /*
   * Ensure the storage directory has the correct layout.
   */
  _initialize()
  {
    // Create directories (if they don't exist)
    fs.mkdirSync(path.resolve(this.base_path, 'keys'), { recursive: true, mode: 0o700 });
    fs.mkdirSync(path.resolve(this.base_path, 'repos'), { recursive: true, mode: 0o700 });

    // Create an ID file; this is is persistent for the node and random.
    const id_path = path.resolve(this.base_path, 'id');
    var id;
    try {
      id = fs.readFileSync(id_path, { encoding: 'utf8' });
    } catch (e) {
      // No ID? Generate one and write it.
      id = uuidv4();
      fs.writeFileSync(id_path, id, { encoding: 'utf8' });
    }
    return id;
  }


  /*
   * Return the file system path for the given repo ID.
   */
  _path_for_repo(id)
  {
    // Since IDs are UUIDs, which are hashes, there's enough entropy
    // in the ID already that we can use it to create fs paths.
    const part1 = id.slice(0, 2);
    const part2 = id.slice(2, 4);
    const ret = path.resolve(this.base_path, 'repos', part1, part2, id);
    debug('Path for repo', id, 'is:', ret);
    return ret;
  }
}

module.exports = {
  Storage: Storage,
  DEFAULT_POOL_SIZE: DEFAULT_POOL_SIZE,
};
