const EventCenter = (typeof require !== 'undefined') ?  require('events').EventEmitter : undefined;

/**
 * Returns a random integer number from the [min, max] interval.
 * 
 * @param {number} min
 * @param {number} max
 */
function randomBetween(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Error thrown when trying to modify a read-only property.
 */
class ReadOnlyError extends Error {
  /**
   * 
   * @param {string | undefined} propName - Name of the property.
   * @param {string} [customMsg] - Message shown if propName is undefined.
   */
  constructor(propName, customMsg) {
    if (propName)
      super(`'${propName}' is a read-only property.`);
    else if (customMsg)
      super(customMsg);

    this.name = this.constructor.name;
    //Error.captureStackTrace(this, ReadOnlyError)
  }
}

/**
 * Error thrown when trying to do something that doesn't work with the current configuration.
 */
class IncompatibleConfigurationError extends Error {
  /**
   * @param {string} message - Message to show.
   */
  constructor(message) {
    super(message);

    this.name = this.constructor.name;
    //Error.captureStackTrace(this, ReadOnlyError)
  }
}

/**
 * Error thrown when invalid arguments are recived.
 */
class InvalidArgumentsError extends Error {
  /**
   * @param {string} message - Message to show.
   */
  constructor(message) {
    super(message);

    this.name = this.constructor.name;
    //Error.captureStackTrace(this, ReadOnlyError)
  }
}

/**
 * Error thrown when events are neccesary but not supported.
 */
class EventsSupportError extends Error {
  /**
   * @param {string} [customMsg] - Custom message to show.
   */
  constructor(customMsg) {
    super(customMsg || 'Events are not supported.');

    this.name = this.constructor.name;
    //Error.captureStackTrace(this, ReadOnlyError)
  }
}

/**
 * Configuration object for BpCollections.
 * 
 * @typedef {Object} BpCollectionConfig
 * @property {boolean} [enableEvents=false]
 * @property {(o: any) => any} [keyExtractor]
 */

/** @type {BpCollectionConfig} */
const defaultBulletproofConfig = {
  keyExtractor: undefined,
  enableEvents: false
}

/**
 * OP alternative to Maps.
 * 
 * Has a lot of useful functions and optional mutation events support.
 * 
 * 'undefined' keys are not allowed.
 * 
 * @template K
 * @template V
 */
class BulletproofCollection {
  /**
   * 
   * @param {BpCollectionConfig} [config]
   */
  constructor(config) {
    // Firm
    this.__bulletproof__ = true;

    // Save configuration
    this._keyExtractor = config.keyExtractor;
    this._enableEvents = Boolean(config.enableEvents);

    //Enable events if neccesary
    if (this._enableEvents)
      this.activateEvents();

    //Init things
    this.reset();
  }

  /**
   * Resets the collection clearing it.
   */
  reset() {
    if (this._map)
      this._map.clear();
    else
      /** @type {Map<K, V>} */
      this._map = new Map();
  }

  /**
   * Enable events support.
   */
  activateEvents() {
    if (EventCenter)
      this._ec = new EventCenter();
    else
      throw new EventsSupportError();
  }

  //// PROPERTY GETTERS AND SETTERS ////

  /**
   * Get the warnings setting.
   * 
   * @returns {boolean}
   */
  get disableWanings() {
    return this._disableWanings;
  }

  /**
   * Set the warnings setting.
   * 
   * @param {boolean} value
   */
  set disableWanings(value) {
    this._disableWanings = Boolean(value);
  }

  /**
   * Get the last accesible index or undefined if the size of the collection is 0.
   * 
   * @readonly
   * @returns {number | undefined}
   */
  get lastIndex() {
    return (this.size === 0) ? undefined : this.size - 1;
  }

  set lastIndex(i) {
    throw new ReadOnlyError('lastIndex');
  }

  /**
   * Get the number of elements in this collection.
   * 
   * @readonly
   * @returns {number}
   */
  get size() {
    return this._map.size;
  }

  set size(s) {
    throw new ReadOnlyError('size');
  }

  /**
   * Returns the first element in the collection.
   * 
   * @returns {V | undefined}
   */
  get first() {
    return this[Symbol.iterator]().next().value;
  }

  set first(f) {
    throw new ReadOnlyError('first');
  }

  /**
   * Returns the last element in the collection.
   * 
   * @returns {V | undefined}
   */
  get last() {
    const { lastIndex } = this;

    if (lastIndex !== undefined)
      return this.index(lastIndex);
  }

  set last(l) {
    throw new ReadOnlyError('last');
  }

  //// BASIC METHODS ////

  /**
   * Adds an element to the collection using the result of the key extractor as a key.
   * 
   * @param {V} value
   * 
   * @returns {BulletproofCollection<K, V>}
   */
  add(value) {
    return this.addCustom(this._keyExtractor(value), value);
  }

  /**
   * Adds an element to the collection using a specific key.
   * 
   * @param {K} key
   * @param {V} value
   * 
   * @returns {BulletproofCollection<K, V>}
   */
  addCustom(key, value) {
    if (key === undefined)
      throw new InvalidArgumentsError(`'undefined' keys are not allowed.`);

    this._map.set(key, value);

    if (this._ec)
      this._ec.emit('add', value, key, this);

    return this;
  }

  /**
   * Returns the element asosiated with the key.
   * 
   * @param {K} k 
   * 
   * @returns {V | undefined}
   */
  key(k) {
    return this._map.get(k);
  }

  /**
   * Returns the element at the index.
   * 
   * @param {number} i 
   * 
   * @returns {V | undefined}
   */
  index(i) {
    let c = 0;

    for (const v of this) {
      if (c === i)
        return v;

      c++;
    }
  }

  /**
   * Get the key of the element at the index i.
   * 
   * @param {number} i 
   * 
   * @returns {K | undefined}
   */
  indexToKey(i) {
    let c = 0;

    for (const k of this.keys) {
      if (c === i)
        return k;

      c++;
    }
  }

  /**
   * Get the index of the element with key k.
   * 
   * @param {K} k 
   * 
   * @returns {number | undefined}
   */
  keyToIndex(k) {
    let c = 0;

    for (const kk of this.keys) {
      if (k === kk)
        return c;

      c++;
    }
  }

  /**
   * Search for an element and return its index.
   * 
   * @param {V} v 
   * 
   * @returns {number | undefined}
   */  
  indexOf(v) {
    let c = 0;

    for (const vv of this) {
      if (v === vv)
        return c;

      c++;
    }
  }

  /**
   * Search for an element and return its key.
   * 
   * @param {V} v
   * 
   * @returns {K | undefined}
   */
  keyOf(v) {
    for (const [kk, vv] of this.keysAndValues)
      if (v === vv)
        return kk;
  }

  /**
   * Returns true if the key exists. Otherwise returns false.
   * 
   * @param {K} k 
   * 
   * @returns {boolean}
   */
  hasKey(k) {
    return this._map.has(k);
  }

  /**
   * Returns true if the index exists. Otherwise returns false.
   * 
   * @param {number} i 
   * 
   * @returns {boolean}
   */
  hasIndex(i) {
    return (i >= 0) && (i < this.size);
  }

  /**
   * Remove the element asociated to the key. Returns the element.
   * 
   * @param {K} k 
   * 
   * @returns {V | undefined}
   */
  removeKey(k) {
    const value = this.key(k)
    const deleted = this._map.delete(k)

    if (deleted && this._ec)
      this._ec.emit('remove', value, k, this);

    return value;
  }

  /**
   * Remove the element at the index i. Returns the element.
   * 
   * @param {number} i 
   * 
   * @returns {V | undefined}
   */
  removeIndex(i) {
    const key = this.indexToKey(i);
    return this.removeKey(key);
  }

  /**
   * Returns a random key of the collection.
   * 
   * @returns {K | undefined}
   */
  randomKey() {
    if (this.size) {
      return this.indexToKey(randomBetween(0, this.lastIndex));
    }
  }

  /**
   * Returns a random element of the collection.
   * 
   * @returns {V | undefined}
   */
  random() {
    return this.key(this.randomKey());
  }

  /**
   * Deletes a random key from the collection and returns it.
   * 
   * @return {K | undefined}
   */
  pullRandomKey() {
    const randKey = this.randomKey();
    this.removeKey(randKey);
    return randKey;
  }

  /**
   * Removes a random element from the collection and returns it.
   * 
   * @return {V | undefined}
   */
  pullRandom() {
    return this.removeKey(this.randomKey());
  }

  /**
   * Returns a new object with the keys/values of this collection.
   * 
   * @returns {Object<K, V>}
   */
  toObject() {
    /** @type {Object<K, V>} */
    const res = {};

    this.forEach((value, key) => {
      res[key] = value;
    });

    return res;
  }

  /**
   * Returns a new map with the keys/values of this collection.
   * 
   * @returns {Map<K, V>}
   */
  toMap() {
    /** @type {Map<K, V>} */
    const res = new Map();

    this.forEach((value, key) => {
      res.set(key, value);
    });

    return res;
  }

  //// ITERATION UTILS ////

  /**
   * Iterates over the values (and only the values) in this collection.
   * 
   * @returns {Iterator<V>}
   */
  * [Symbol.iterator]() {
    for (const v of this._map.values())
      yield v;
  }

  * _keys() {
    for (const k of this._map.keys())
      yield k;
  }

  /**
   * Returns an interable of keys in this collection.
   * 
   * @returns {Iterable<K>}
   */
  get keys() {
    return this._keys();
  }

  set keys(k) {
    throw new ReadOnlyError('keys');
  }

  * _keysAndValues() {
    for (const kv of this._map)
      yield kv;
  }

  /**
   * Returns an interable of arrays [key, value].
   * 
   * @returns {Iterable<[K, V]>}
   */
  get keysAndValues() {
    return this._keysAndValues();
  }

  set keysAndValues(k) {
    throw new ReadOnlyError('keysAndValues');
  }

  /* Index currentindex, currentkey currentelement when any iter*/

  /**
   * @callback ForEachCallback
   * @param {V} value
   * @param {K} key
   * @param {BulletproofCollection<K, V>} bpc
   */

  /**
   * Iterates over the elements of the collection
   * 
   * @param {ForEachCallback} fn
   * @param {any} [thisArg]
   */
  forEach(fn, thisArg) {
    this._map.forEach((value, key) => {
      fn.call(thisArg, value, key, this);
    });
  }

  /**
   * Equivalent to array map but with key as second parameter.
   * 
   * @param {ForEachCallback} fn
   * @param {any} [thisArg]
   * 
   * @returns {any[]}
   */
  map(fn, thisArg) {
    /** @type {any[]} */
    const res = [];

    this.forEach((value, key, bpc) => {
      res.push(fn.call(thisArg, value, key, bpc));
    })

    return res;
  }

  /**
   * Similar to filterToArray but returns a minimal BulletproofCollection.
   * 
   * The resultant BpCollection has the same keyExtractor but no events support.
   * 
   * @param {ForEachCallback} fn
   * @param {any} [thisArg]
   * 
   * @returns {BulletproofCollection<K, V>}
   */
  filter(fn, thisArg) {
    /** @type {BulletproofCollection<K, V>} */
    const res = new BulletproofCollection({keyExtractor: this._keyExtractor});

    this.forEach((value, key, bpc) => {
      if (fn.call(thisArg, value, key, bpc))
        res.addCustom(key, value);
    })

    return res;
  }

  /**
   * Equivalent to array filter but with key as second parameter.
   * 
   * @param {ForEachCallback} fn
   * @param {any} [thisArg]
   * 
   * @returns {V[]}
   */
  filterToArray(fn, thisArg) {
    /** @type {V[]} */
    const res = [];

    this.forEach((value, key, bpc) => {
      if (fn.call(thisArg, value, key, bpc))
        res.push(value);
    })

    return res;
  }
}

module.exports = BulletproofCollection;