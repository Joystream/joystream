'use strict';

const DEFAULT_POOL_SIZE = 1024;

const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const uuidv5 = require('uuid/v5');

const debug = require('debug')('joystream:storage');

const repository = require('joystream/core/repository');
const lru = require('joystream/util/lru');
const fswalk = require('joystream/util/fs/walk');


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

    this.new = false;
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
   * Return a synchronization stream for the repository, nor nothing. read_open()
   * and write_open() aliases exist in case this is going to be a different stream
   * in future.
   */
  read_open(id)
  {
    return this.sync_stream(id);
  }

  write_open(id)
  {
    return this.sync_stream(id);
  }

  sync_stream(id)
  {
    const repo = this.get(id);
    if (!repo) {
      debug('No repository for', id);
      return undefined;
    }

    // It's also possible that the repository cannot be synchronized.
    if (!repo.replicate) {
      debug('Repository', id, 'cannot be synchronized.');
      return undefined;
    }
    return repo.replicate();
  }


  /*
   * Create a repository. Return the id and repository in an object.
   *
   * The public key is optional. If given, it will be stored in the storage
   * hierarchy, and passed on to the repository instance as the signing
   * authority for all changes. TODO implement this
   *
   * Also optional is the template function. It's a simple function accepting
   * the repository, and initializing it with data *before* the repository
   * instance is put into the pool. This allows for the repository to be
   * populated before use.
   *
   * Finally, the callback(err, id, repo) is invoked when the Repository
   * instance has become part of the pool. Before the callback is invoked,
   * the id and pool are returned by the create() function, but the repo
   * may not be finalized. Passing the callback is equivalent to registering
   * a 'ready' event handler on the returned repository.
   */
  create(pubkey, template, cb)
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

    // Finaliser function after the template is done.
    const commit = () => {
      this.pool.put(id, repo);
      if (cb) {
        cb(null, id, repo);
      }
    };

    const repo = new repository.Repository(repo_path, this.use_fs);
    repo.on('ready', () => {
      if (template) {
        repo.populate(template, commit);
      }
      else {
        // No template, commit
        commit();
      }
    });

    return {
      id: id,
      repo: repo,
    }
  }

  /*
   * Return true if a repo exists.
   */
  has(id)
  {
    const repo_path = this._path_for_repo(id);
    return fs.existsSync(repo_path);
  }

  /*
   * Call the callback with all repository IDs found in the storage.
   */
  repos(cb)
  {
    fswalk(this.base_path, (err, relname, stat, linktarget) => {
      if (err) {
        cb(err);
        return;
      }
      if (!relname) {
        cb(null, undefined);
        return;
      }

      const base = path.basename(relname);
      if (this.has(base)) {
        cb(null, base);
      }
    });
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
      this.new = true;
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
