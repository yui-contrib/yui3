YUI.add("base",function(A){var J=A.Lang;function D(L){this._plugins={};this.after("init",function(P,O){this._initPlugins(O);});this.after("destroy",this._destroyPlugins);}D.prototype={plug:function(P){if(P){if(J.isArray(P)){var O=P.length;for(var L=0;L<O;L++){this.plug(P[L]);}}else{if(J.isFunction(P)){this._plug(P);}else{this._plug(P.fn,P.cfg);}}}return this;},unplug:function(L){if(L){this._unplug(L);}else{for(L in this._plugins){if(A.Object.owns(this._plugins,L)){this._unplug(L);}}}return this;},hasPlugin:function(L){return(this._plugins[L]&&this[L]);},_initPlugins:function(L){var P=this._getClasses(),Q;for(var O=P.length-1;O>=0;O--){Q=P[O];if(Q.PLUGINS){this.plug(Q.PLUGINS);}}if(L&&L.plugins){this.plug(L.plugins);}},_destroyPlugins:function(){this._unplug();},_plug:function(P,L){if(P&&P.NS){var O=P.NS;L=L||{};L.owner=this;if(this.hasPlugin(O)){this[O].setAttrs(L);}else{this[O]=new P(L);this._plugins[O]=P;}}},_unplug:function(L){if(L){if(this[L]){this[L].destroy();delete this[L];}if(this._plugins[L]){delete this._plugins[L];}}}};A.PluginHost=D;var H=A.Object,I=".",F="destroy",N="init",M="initialized",G="destroyed",C="initializer",B=Object.prototype.constructor,K="destructor";function E(){A.Attribute.call(this);this.init.apply(this,arguments);}E.NAME="base";E.ATTRS={initialized:{readOnly:true,value:false},destroyed:{readOnly:true,value:false}};E._buildCfg={aggregates:["ATTRS","PLUGINS"]};E.build=function(L,R,V,U){var X=E.build,O=X._getClass(R,U),T=X._getAggregates(R,U),S,Q,P,W;if(T){for(S=0,Q=T.length;S<Q;++S){P=T[S];if(R.hasOwnProperty(P)){O[P]=J.isArray(R[P])?[]:{};}}A.aggregate(O,R,true,T);}for(S=0,Q=V.length;S<Q;S++){W=V[S];if(T){A.aggregate(O,W,true,T);}A.mix(O,W,true,null,1);O._yuibuild.exts.push(W);}O.prototype.hasImpl=X._hasImpl;O.NAME=L;O.prototype.constructor=O;return O;};A.mix(E.build,{_template:function(L){function O(){O.superclass.constructor.apply(this,arguments);var R=O._yuibuild.exts,P=R.length,Q;for(Q=0;Q<P;Q++){R[Q].apply(this,arguments);}return this;}A.extend(O,L);return O;},_hasImpl:function(O){if(this.constructor._yuibuild){var Q=this.constructor._yuibuild.exts,L=Q.length,P;for(P=0;P<L;P++){if(Q[P]===O){return true;}}}return false;},_getClass:function(L,O){var P=E.build._template(L);P._yuibuild={id:null,exts:[]};return P;},_getAggregates:function(L,O){var P=[],R=(O&&O.aggregates),S=L,Q;while(S&&S.prototype){Q=S._buildCfg&&S._buildCfg.aggregates;if(Q){P=P.concat(Q);}S=S.superclass?S.superclass.constructor:null;}if(R){P=P.concat(R);}return P;}});E.prototype={init:function(L){this.name=this.constructor.NAME;this._yuievt.config.prefix=this.name;this.publish(N,{queuable:false,defaultFn:this._defInitFn});A.PluginHost.call(this);this.fire(N,null,L);return this;},destroy:function(){this.publish(F,{queuable:false,defaultFn:this._defDestroyFn});this.fire(F);return this;},_defInitFn:function(O,L){this._initHierarchy(L);this._set(M,true);},_defDestroyFn:function(L){this._destroyHierarchy();this._set(G,true);},_getClasses:function(){if(!this._classes){this._initHierarchyData();}return this._classes;},_getAttrCfgs:function(){if(!this._attrs){this._initHierarchyData();}return this._attrs;},_filterAttrCfgs:function(P,L){var O={};if(P.ATTRS){A.each(P.ATTRS,function(R,Q){if(L[Q]){O[Q]=L[Q];delete L[Q];}});}return O;},_initHierarchyData:function(){var P=this.constructor,O=[],L=[];while(P&&P.prototype){O[O.length]=P;if(P.ATTRS){L[L.length]=P.ATTRS;}P=P.superclass?P.superclass.constructor:null;}this._classes=O;this._attrs=this._aggregateAttrs(L);},_aggregateAttrs:function(R){var L,P,O,U,T,Q,S={};if(R){for(Q=R.length-1;Q>=0;--Q){P=R[Q];for(L in P){if(P.hasOwnProperty(L)){O=A.merge(P[L]);U=O.value;if(U&&!O.useRef&&(B===U.constructor||J.isArray(U))){O.value=A.clone(U);}if(L.indexOf(I)!==-1){T=L.split(I);L=T.shift();}else{T=null;}if(T&&S[L]&&S[L].value){H.setValue(S[L].value,T,U);}else{if(!T){if(!S[L]){S[L]=O;}else{S[L]=A.mix(S[L],O,true);}}}}}}}return S;},_initHierarchy:function(R){var Q,L,P,O=this._getClasses(),S=this._getAttrCfgs();for(P=O.length-1;P>=0;P--){Q=O[P];L=Q.prototype;this.addAttrs(this._filterAttrCfgs(Q,S),R);if(L.hasOwnProperty(C)){L[C].apply(this,arguments);}}},_destroyHierarchy:function(){var R,O,Q,L,P=this._getClasses();for(Q=0,L=P.length;Q<L;Q++){R=P[Q];O=R.prototype;if(O.hasOwnProperty(K)){O[K].apply(this,arguments);}}},toString:function(){return this.constructor.NAME+"["+A.stamp(this)+"]";}};A.mix(E,A.Attribute,false,null,1);A.mix(E,A.PluginHost,false,null,1);E.prototype.constructor=E;A.Base=E;},"@VERSION@",{requires:["attribute"]});