    /**
     * Base class support for objects requiring managed attributes and acting as event targets.
     *
     * Also provides the an augmentable PluginHost interface.
     *
     * @module base
     */
    var O = Y.Object,
        DOT = ".",
        DESTROY = "destroy",
        INIT = "init",
        INITIALIZED = "initialized",
        DESTROYED = "destroyed",
        INITIALIZER = "initializer",
        OBJECT_CONSTRUCTOR = Object.prototype.constructor,
        DESTRUCTOR = "destructor";

    /**
     * <p>
     * Provides a base class for managed attribute based
     * objects, which handles the chaining of initializer and destructor methods
     * across the hierarchy during init and destroy lifecycle methods and 
     * handles automatic configuration of registered Attributes, through 
     * the static <a href="#property_ATTRS">ATTRS</a> property.
     * </p>
     *
     * <p>The Base class also handles prefixing of event types with the static <a href="#property_NAME">NAME</a> 
     * property for all events fired from instances of classes derived from Base.</p>
     *
     * @constructor
     * @class Base
     * @uses Attribute, PluginHost
     *
     * @param {Object} config Object literal of configuration property name/value pairs
     */
    function Base() {
        Y.log('constructor called', 'life', 'base');
        Y.Attribute.call(this);
        this.init.apply(this, arguments);
    }

    /**
     * <p>
     * Name string to be used to identify instances of 
     * this class, for example in prefixing events.
     * </p>
     * <p>
     * Classes extending Base, should define their own
     * static NAME property.
     * </p>
     * @property NAME
     * @type String
     * @static
     */
    Base.NAME = 'base';

    /**
     * Object literal defining the set of attributes which
     * will be available for instances of this class, and 
     * how they are configured. See Attributes addAtt method
     * for a description of configuration options available 
     * for each attribute.
     *
     * @property ATTRS
     * @type Object
     * @static
     */
    Base.ATTRS = {
        /**
         * Flag indicating whether or not this object
         * has been through the init lifecycle phase.
         *
         * @attribute initialized
         * @readOnly
         * @default false
         * @type boolean
         */
        initialized: {
            readOnly:true,
            value:false
        },

        /**
         * Flag indicating whether or not this object
         * has been through the destroy lifecycle phase.
         *
         * @attribute destroyed
         * @readOnly
         * @default false
         * @type boolean
         */
        destroyed: {
            readOnly:true,
            value:false
        }
    };

    /**
     * The build configuration for the Base class.
     * Defines the static fields which need to be aggregated,
     * when this class is used as the main class passed to 
     * the <a href="#method_build">Base.build</a> method.
     *
     * @property _buildCfg
     * @type Object
     * @static
     * @final
     * @private
     */
    Base._buildCfg = {
        aggregates : ["ATTRS", "PLUGINS"]
    };

    /**
     * <p>
     * Builds a constructor function (class) from the
     * main function, and array of extension functions (classes)
     * provided.
     * </p>
     * <p>
     * The cfg object literal supports the following properties
     * </p>
     * <dl>
     *    <dt>aggregates &#60;String[]&#62;</dt>
     *    <dd>An array of static property names, which will get aggregated
     *    on to the built class, in addition to the default properties build 
     *    will always aggregate as defined by the main class' _buildCfg
     *    property.
     *    </dd>
     * </dl>
     *
     * @method build
     * @static
     * @param {Function} main The name of the new class
     * @param {Function} main The main class on which to base the built class
     * @param {Function[]} extensions The set of extension classes which will be
     * augmented/aggregated to the built class.
     * @param {Object} cfg Optional. Configuration for the class.
     * @return {Function} A custom class, created from the provided main and extension classes
     */
    Base.build = function(name, main, extensions, cfg) {

        var build = Base.build,
            builtClass = build._getClass(main, cfg),
            aggregates = build._getAggregates(main, cfg),
            i, l, val, extClass;

        // Shallow isolate aggregates
        if (aggregates) {
            for (i = 0, l = aggregates.length; i < l; ++i) {
                val = aggregates[i];
                if (main.hasOwnProperty(val)) {
                    builtClass[val] = L.isArray(main[val]) ? [] : {};
                }
            }
            Y.aggregate(builtClass, main, true, aggregates);
        }

        // Augment/Aggregate
        for (i = 0, l = extensions.length; i < l; i++) {
            extClass = extensions[i];

            if (aggregates) {
                Y.aggregate(builtClass, extClass, true, aggregates);
            }

            // Old augment
            Y.mix(builtClass, extClass, true, null, 1);

            builtClass._yuibuild.exts.push(extClass);
        }

        builtClass.prototype.hasImpl = build._hasImpl;
        builtClass.NAME = name;
        builtClass.prototype.constructor = builtClass;

        return builtClass;
    };

    Y.mix(Base.build, {

        _template: function(main) {

            function BuiltClass() {

                BuiltClass.superclass.constructor.apply(this, arguments);

                var f = BuiltClass._yuibuild.exts, 
                    l = f.length,
                    i;

                for (i = 0; i < l; i++) {
                    f[i].apply(this, arguments);
                }

                return this;
            }
            Y.extend(BuiltClass, main);

            return BuiltClass;
        },

        _hasImpl : function(extClass) {
            if (this.constructor._yuibuild) {
                var f = this.constructor._yuibuild.exts,
                    l = f.length,
                    i;

                for (i = 0; i < l; i++) {
                    if (f[i] === extClass) {
                        return true;
                    }
                }
            }
            return false;
        },

        _getClass : function(main, cfg) {

            var builtClass = Base.build._template(main);

            builtClass._yuibuild = {
                id: null,
                exts : []
            };

            return builtClass;
        },

        _getAggregates : function(main, cfg) {
            var aggr = [],
                cfgAggr = (cfg && cfg.aggregates),
                c = main,
                classAggr;

            while (c && c.prototype) {
                classAggr = c._buildCfg && c._buildCfg.aggregates;
                if (classAggr) {
                    aggr = aggr.concat(classAggr);
                }
                c = c.superclass ? c.superclass.constructor : null;
            }

            if (cfgAggr) {
                aggr = aggr.concat(cfgAggr);
            }

            return aggr;
        }
    });

    Base.prototype = {

        /**
         * Init lifecycle method, invoked during construction.
         * Fires the init event prior to invoking initializers on
         * the class hierarchy.
         * 
         * @method init
         * @final
         * @chainable
         * @param {Object} config Object literal of configuration property name/value pairs
         * @return {Base} A reference to this object
         */
        init: function(config) {
            Y.log('init called', 'life', 'base');

            /**
             * The name string to be used to identify 
             * this instance of object. 
             * @property name
             * @type String
             */
            this.name = this.constructor.NAME;
            this._yuievt.config.prefix = this.name;

            /**
             * <p>
             * Lifecycle event for the init phase, fired prior to initialization. 
             * Invoking the preventDefault method on the event object provided 
             * to subscribers will prevent initialization from occuring.
             * </p>
             * <p>
             * Subscribers to the "after" momemt of this event, will be notified
             * after initialization of the object is complete (and therefore
             * cannot prevent initialization).
             * </p>
             *
             * @event init
             * @preventable _defInitFn
             * @param {Event.Facade} e Event object
             * @param config Object literal of configuration name/value pairs
             */
            this.publish(INIT, {
                queuable:false,
                defaultFn:this._defInitFn
            });

            Y.PluginHost.call(this);

            this.fire(INIT, null, config);
            return this;
        },

        /**
         * <p>
         * Destroy lifecycle method. Fires the destroy
         * event, prior to invoking destructors for the
         * class hierarchy.
         * </p>
         * <p>
         * Subscribers to the destroy
         * event can invoke preventDefault on the event object, to prevent destruction
         * from proceeding.
         * </p>
         * @method destroy
         * @return {Base} A reference to this object
         * @final
         * @chainable
         */
        destroy: function() {
            Y.log('destroy called', 'life', 'base');

            /**
             * <p>
             * Lifecycle event for the destroy phase, 
             * fired prior to destruction. Invoking the preventDefault 
             * method on the event object provided to subscribers will 
             * prevent destruction from proceeding.
             * </p>
             * <p>
             * Subscribers to the "after" moment of this event, will be notified
             * after destruction is complete (and as a result cannot prevent
             * destruction).
             * </p>
             * @event destroy
             * @preventable _defDestroyFn
             * @param {Event.Facade} e Event object
             */
            this.publish(DESTROY, {
                queuable:false,
                defaultFn: this._defDestroyFn
            });
            this.fire(DESTROY);
            return this;
        },

        /**
         * Default init event handler
         *
         * @method _defInitFn
         * @param {Event.Facade} e Event object
         * @param {Object} config Object literal of configuration property name/value pairs
         * @protected
         */
        _defInitFn : function(e, config) {
            this._initHierarchy(config);
            this._set(INITIALIZED, true);
        },

        /**
         * Default destroy event handler
         *
         * @method _defDestroyFn
         * @param {Event.Facade} e Event object
         * @protected
         */
        _defDestroyFn : function(e) {
            this._destroyHierarchy();
            this._set(DESTROYED, true);
        },

        /**
         * Returns the class hierarchy for this object, with Base being the last class in the array.
         * 
         * @method _getClasses
         * @protected
         * @return {Function[]} An Array of classes (constructor functions), making up the class hierarchy for this object
         */
        _getClasses : function() {
            if (!this._classes) {
                this._initHierarchyData();
            }
            return this._classes;
        },

        /**
         * Returns an aggregated set of attribute configurations, by traversing the class hierarchy.
         *
         * @method _getAttrCfgs
         * @protected
         * @return {Object} The hash of attribute configurations, aggregated across classes in the hierarchy
         */
        _getAttrCfgs : function() {
            if (!this._attrs) {
                this._initHierarchyData();
            }
            return this._attrs;
        },

        /**
         * 
         * @method _filterAttrCfs
         * @private
         * @param {Function} clazz
         * @param {Objects} allCfgs
         */
        _filterAttrCfgs : function(clazz, allCfgs) {
            var cfgs = {};

            if (clazz.ATTRS) {
                Y.each(clazz.ATTRS, function(v, k) {
                    if (allCfgs[k]) {
                        cfgs[k] = allCfgs[k];
                        delete allCfgs[k];
                    }
                });
            }

            return cfgs;
        },

        /**
         * @method _initHierarchyData
         * @private
         */
        _initHierarchyData : function() {
            var c = this.constructor, 
                classes = [],
                attrs = [];

            while (c && c.prototype) {
                // Add to classes
                classes[classes.length] = c;

                // Add to attributes
                if (c.ATTRS) {
                    attrs[attrs.length] = c.ATTRS;
                }
                c = c.superclass ? c.superclass.constructor : null;
            }

            this._classes = classes;
            this._attrs = this._aggregateAttrs(attrs);
        },

        /**
         * @method _aggregateAttrs
         * @private
         * @param {Object} allAttrs
         */
        _aggregateAttrs : function(allAttrs) {
            var attr, attrs, cfg, val, path, i,
                aggAttrs = {};

            if (allAttrs) {
                for (i = allAttrs.length-1; i >= 0; --i) {
                    attrs = allAttrs[i];
                    for (attr in attrs) {
                        if (attrs.hasOwnProperty(attr)) {
    
                            cfg = Y.merge(attrs[attr]);

                            val = cfg.value;
                            if (val && !cfg.useRef && (OBJECT_CONSTRUCTOR === val.constructor || L.isArray(val))) {
                                cfg.value = Y.clone(val);
                            }
    
                            if (attr.indexOf(DOT) !== -1) {
                                path = attr.split(DOT);
                                attr = path.shift();
                            } else {
                                path = null;
                            }
    
                            if (path && aggAttrs[attr] && aggAttrs[attr].value) {
                                O.setValue(aggAttrs[attr].value, path, val);
                            } else if (!path){
                                if (!aggAttrs[attr]) {
                                    aggAttrs[attr] = cfg;
                                } else {
                                    aggAttrs[attr] = Y.mix(aggAttrs[attr], cfg, true);
                                }
                            }
                        }
                    }
                }
            }

            return aggAttrs;
        },

        /**
         * Initializes the class hierarchy rooted at this base class,
         * which includes initializing attributes for each class defined 
         * in the class's static <a href="#property_ATTRS">ATTRS</a> property and invoking the initializer 
         * method on the prototype of each class in the hierarchy.
         *
         * @method _initHierarchy
         * @param {Object} userConf Object literal containing attribute name/value pairs
         * @private
         */
        _initHierarchy : function(userConf) {
            var constr,
                constrProto,
                ci,
                classes = this._getClasses(),
                mergedCfgs = this._getAttrCfgs();

            for (ci = classes.length-1; ci >= 0; ci--) {
                constr = classes[ci];
                constrProto = constr.prototype;

                this.addAttrs(this._filterAttrCfgs(constr, mergedCfgs), userConf);

                if (constrProto.hasOwnProperty(INITIALIZER)) {
                    constrProto[INITIALIZER].apply(this, arguments);
                }
            }
        },

        /**
         * Destroys the class hierarchy rooted at this base class by invoking
         * the descructor method on the prototype of each class in the hierarchy.
         *
         * @method _destroyHierarchy
         * @private
         */
        _destroyHierarchy : function() {
            var constr,
                constrProto,
                ci, cl,
                classes = this._getClasses();

            for (ci = 0, cl = classes.length; ci < cl; ci++) {
                constr = classes[ci];
                constrProto = constr.prototype;
                if (constrProto.hasOwnProperty(DESTRUCTOR)) {
                    constrProto[DESTRUCTOR].apply(this, arguments);
                }
            }
        },

        /**
         * Default toString implementation. Provides the constructor NAME
         * and the instance ID.
         * 
         * @method toString
         * @return {String} String representation for this object
         */
        toString: function() {
            return this.constructor.NAME + "[" + Y.stamp(this) + "]";
        }
    };

    // straightup augment, no wrapper functions
    Y.mix(Base, Y.Attribute, false, null, 1);
    Y.mix(Base, Y.PluginHost, false, null, 1);

    Base.prototype.constructor = Base;
    Y.Base = Base;
