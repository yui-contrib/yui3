YUI.add('cache', function(Y) {

/**
 * The Cache utility provides a common configurable interface for components to
 * cache and retrieve data from a local JavaScript struct.
 *
 * @module cache
 * @requires base
 * @title Cache Utility
 */
    var LANG = Y.Lang,
    
    /**
     * Base class for the YUI Cache utility.
     * @class Cache
     * @extends Base
     * @constructor
     */    
    Cache = function() {
        Cache.superclass.constructor.apply(this, arguments);
    };
    

    /////////////////////////////////////////////////////////////////////////////
    //
    // Cache static properties
    //
    /////////////////////////////////////////////////////////////////////////////
Y.mix(Cache, {    
    
    /**
     * Class name.
     *
     * @property NAME
     * @type String
     * @static     
     * @final
     * @value "cache'
     */
    NAME: "cache",


    ATTRS: {
        /////////////////////////////////////////////////////////////////////////////
        //
        // Cache Attributes
        //
        /////////////////////////////////////////////////////////////////////////////
        
        /**
        * @attribute size
        * @description Max number of entries the Cache will hold.
        * Set to 0 to turn off caching.
        * @type Number
        * @default 0
        */
        size: {
            value: 0,
            validator: function(value) {
                return (LANG.isNumber(value) && (value >= 0));
            },
            set: function(value) {
                // If the cache is full, make room by removing stalest element (index=0)
                var entries = this._entries;
                if(LANG.isNumber(value) && value > 0) {
                    if(entries) {
                        while(entries.length > value) {
                            entries.shift();
                        }
                    }
                    return value;
                }
                else {
                    this._entries = [];
                    return 0;
                }
            }
        }
    }
});
    
Y.extend(Cache, Y.Base, {
    /////////////////////////////////////////////////////////////////////////////
    //
    // Cache private properties
    //
    /////////////////////////////////////////////////////////////////////////////
    
    /**
     * Array of request/response objects indexed chronologically.
     *
     * @property _entries
     * @type Object[]
     * @private
     */
    _entries: null,

    /////////////////////////////////////////////////////////////////////////////
    //
    // Cache private methods
    //
    /////////////////////////////////////////////////////////////////////////////

    /**
    * @method initializer
    * @description Internal init() handler.
    * @private        
    */
    initializer: function() {

        /**
        * @event add
        * @description Fired when an entry is added.
        * @param e {Event.Facade} Event Facade object.
        * @param entry {Object} The cached entry.
        * @preventable _handleAdd
        */
        this.publish("add", {defaultFn: this._handleAdd});

        /**
        * @event flush
        * @description Fired when the cache is flushed.
        * @param e {Event.Facade} Event Facade object.
        * @preventable _handleFlush
        */
        this.publish("flush", {defaultFn: this._handleFlush});

        /**
        * @event request
        * @description Fired when an entry is requested from the cache.
        * @param e {Event.Facade} Event Facade object. 
        * @param request {Object} The request object.
        */

        /**
        * @event retrieve
        * @description Fired when an entry is retrieved from the cache.
        * @param e {Event.Facade} Event Facade object.
        * @param entry {Object} The retrieved entry.
        */

        // Initialize internal values
        this._entries = [];
    },

    /**
    * @method destructor
    * @description Internal destroy() handler.
    * @private        
    */
    destructor: function() {
        this._entries = null;
    },

    /////////////////////////////////////////////////////////////////////////////
    //
    // Cache protected methods
    //
    /////////////////////////////////////////////////////////////////////////////

    /**
     * The default add behavior.
     *
     * @method _handleAdd
     * @param e {Event.Facade} Event Facade object.
     * @param entry {Object} The cached entry.
     * @protected
     */
    _handleAdd: function(e, entry) {
        var entries = this._entries,
            max = this.get("size");
            
        if(!entries || (max === 0)) {
            e.stopImmediatePropagation();
            return;
        }        
    
        // If the cache at or over capacity, make room by removing stalest element (index=0)
        while(entries.length >= (max)) {
            entries.shift();
        }
    
        // Add entry to cache in the newest position, at the end of the array
        entries[entries.length] = entry;
    },

    /**
     * Flushes cache.
     *
     * @method _handleFlush
     * @param e {Event.Facade} Event Facade object.
     * @protected     
     */
    _handleFlush: function(e) {
        this._entries = [];
    },

    /////////////////////////////////////////////////////////////////////////////
    //
    // Cache public methods
    //
    /////////////////////////////////////////////////////////////////////////////

    /**
     * Accessor to internal array of entries
     *
     * @method getEntries
     * @return {Array} Internal array of cache entries.
     */
    getEntries: function() {
        return this._entries;
    },

    /**
     * Default overridable method compares current request with given cache entry.
     * Returns true if current request matches the cached request, otherwise
     * false. Implementers should override this method to customize the
     * cache-matching algorithm.
     *
     * @method isMatch
     * @param request {Object} Request object.
     * @param entry {Object} Cached entry.
     * @return {Boolean} True if current request matches given cached request, false otherwise.
     */
    isMatch: function(request, entry) {
        return (request === entry.request);
    },

    /**
     * Adds a new entry to the cache of the format
     * {request:request, response:response, payload:payload}.
     * If cache is full, evicts the stalest entry before adding the new one.
     *
     * @method add
     * @param request {Object} Request object.
     * @param response {Object} Response object.
     * @param payload {Object} (optional) Arbitrary data payload.
     */
    add: function(request, response, payload) {
        if(LANG.isValue(request) && LANG.isValue(response)) {
            this.fire("add", null, {request:request, response:response, payload:payload});
        }
        else {
        }
    },

    /**
     * Flushes cache.
     *
     * @method flush
     */
    flush: function() {
        this.fire("flush");
    },

    /**
     * Retrieves cached entry for given request, if available, and refreshes
     * entry in the cache. Returns null if there is no cache match.
     *
     * @method retrieve
     * @param request {Object} Request object.
     * @return {Object} Cached entry object with the properties request, response, and payload, or null.
     */
    retrieve: function(request) {
        // If cache is enabled...
        var entries = this._entries,     
            length = entries.length,
            entry = null,
            i = length-1;
            
        if((this.get("size") > 0) && (length > 0)) {   
            this.fire("request", null, request);
    
            // Loop through each cached entry starting from the newest
            for(; i >= 0; i--) {
                entry = entries[i];
    
                // Execute matching function
                if(this.isMatch(request, entry)) {
                    this.fire("retrieve", null, entry);
                    
                    // Refresh the position of the cache hit
                    if(i < length-1) {
                        // Remove element from its original location
                        entries.splice(i,1);
                        // Add as newest
                        entries[entries.length] = entry;
                        break;
                    } 
                }
            }
            return entry;

        }
        return null;
    }
});
    
    Y.namespace("Cache");
    Y.Cache = Cache;
    



}, '@VERSION@' ,{requires:['base']});
