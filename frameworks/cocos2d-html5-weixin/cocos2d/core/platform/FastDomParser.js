/**
 *Copyright (c) 2015(s), Konstantin Ershov

 Permission to use, copy, modify, and/or distribute this software for any
 purpose with or without fee is hereby granted, provided that the above
 copyright notice and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

//https://developer.mozilla.org/en-US/docs/Web/API/Element
var FastDomParser = function(){};

(function(){
    function Node(cfg) {

        this.namespace     = cfg.namespace || null;
        this.text          = cfg.text;
        this._selfCloseTag = cfg.selfCloseTag;


        Object.defineProperties(this, {
            nodeType: {
                value: cfg.nodeType
            },
            nodeName: {
                value: cfg.nodeType == 1 ? cfg.nodeName : '#text'
            },
            childNodes: {
                value: cfg.childNodes
            },
            firstChild: {
                get: function(){
                    return this.childNodes[0] || null;
                }
            },
            lastChild: {
                get: function(){
                    return this.childNodes[this.childNodes.length-1] || null;
                }
            },
            parentNode: {
                value: cfg.parentNode || null
            },
            attributes: {
                value: cfg.attributes || []
            },
            innerHTML: {
                get: function(){
                    var
                        result = '',
                        cNode;
                    for (var i = 0, l = this.childNodes.length; i < l; i++) {
                        cNode = this.childNodes[i];
                        result += cNode.nodeType === 3 ? cNode.text : cNode.outerHTML;
                    }
                    return result;
                }
            },
            outerHTML: {
                get: function(){
                    if (this.nodeType != 3){
                        var
                            str,
                            attrs = (this.attributes.map(function(elem){
                                return elem.name + (elem.value ? '=' + '"'+ elem.value +'"' : '');
                            }) || []).join(' '),
                            childs = '';

                        str = '<' + this.nodeName + (attrs ? ' ' + attrs : '') + (this._selfCloseTag ? '/' : '') + '>';

                        if (!this._selfCloseTag){
                            childs = (this._selfCloseTag ? '' : this.childNodes.map(function(child){
                                return child.outerHTML;
                            }) || []).join('');

                            str += childs;
                            str += '</' + this.nodeName + '>';
                        }
                    }
                    else{
                        str = this.textContent;
                    }
                    return str;
                }
            },
            textContent: {
                get: function(){
                    if (this.nodeType == Node.TEXT_NODE){
                        return this.text;
                    }
                    else{
                        return this.childNodes.map(function(node){
                            return node.textContent;
                        }).join('').replace(/\x20+/g, ' ');
                    }
                }
            }
        });
    }

    Node.prototype.getAttribute = function (attributeName) {
        for (var i = 0, l = this.attributes.length; i < l; i++) {
            if (this.attributes[i].name == attributeName) {
                return this.attributes[i].value;
            }
        }
        return null;
    };

    function searchElements(root, conditionFn, onlyFirst){
        var result = [];
        onlyFirst = !!onlyFirst;
        if (root.nodeType !== 3) {
            for (var i = 0, l = root.childNodes.length; i < l; i++) {
                if (root.childNodes[i].nodeType !== 3 && conditionFn(root.childNodes[i])) {
                    result.push(root.childNodes[i]);
                    if (onlyFirst){
                        break;
                    }
                }
                result = result.concat(searchElements(root.childNodes[i], conditionFn));
            }
        }
        return onlyFirst ? result[0] : result;
    }

    Node.prototype.getElementsByTagName = function (tagName) {
        return searchElements(this, function(elem){
            return elem.nodeName == tagName;
        })
    };

    Node.prototype.getElementsByClassName = function (className) {
        var expr = new RegExp('^(.*?\\s)?' + className + '(\\s.*?)?$');
        return searchElements(this, function(elem){
            return elem.attributes.length && expr.test(elem.getAttribute('class'));
        })
    };

    Node.prototype.getElementById = function (id) {
        return searchElements(this, function(elem){
            return elem.attributes.length && elem.getAttribute('id') == id;
        }, true)
    };

    Node.prototype.getElementsByName = function (name) {
        return searchElements(this, function(elem){
            return elem.attributes.length && elem.getAttribute('name') == name;
        })
    };


    Node.ELEMENT_NODE = 1;
    Node.TEXT_NODE    = 3;

    var
        tagRegExp          = /(<\/?[a-z][a-z0-9]*(?::[a-z][a-z0-9]*)?\s*(?:\s+[a-z0-9-_]+=(?:(?:'[\s\S]*?')|(?:"[\s\S]*?")))*\s*\/?>)|([^<]|<(?![a-z\/]))*/gi,
        attrRegExp         = /\s[a-z0-9-_]+\b(\s*=\s*('|")[\s\S]*?\2)?/gi,
        splitAttrRegExp    = /(\s[a-z0-9-_]+\b\s*)(?:=(\s*('|")[\s\S]*?\3))?/gi,
        startTagExp        = /^<[a-z]/,
        selfCloseTagExp    = /\/>$/,
        closeTagExp        = /^<\//,
        nodeNameExp        = /<\/?([a-z][a-z0-9]*)(?::([a-z][a-z0-9]*))?/i,
        attributeQuotesExp = /^('|")|('|")$/g,
        noClosingTagsExp   = /^(?:area|base|br|col|command|embed|hr|img|input|link|meta|param|source)/i;


    function findByRegExp(html, selector, onlyFirst) {

        var
            result        = [],
            tagsCount     = 0,
            tags          = html.match(tagRegExp),
            composing     = false,
            currentObject = null,
            matchingSelector,
            fullNodeName,
            selfCloseTag,
            attributes,
            attrBuffer,
            attrStr,
            buffer,
            tag;

        for (var i = 0, l = tags.length; i < l; i++) {

            tag = tags[i];
            fullNodeName = tag.match(nodeNameExp);

            matchingSelector = selector.test(tag);

            if (matchingSelector && !composing){
                composing = true;
            }

            if (composing) {

                if (startTagExp.test(tag)) {
                    selfCloseTag = selfCloseTagExp.test(tag) || noClosingTagsExp.test(fullNodeName[1]);
                    attributes = [];
                    attrStr = tag.match(attrRegExp) || [];
                    for (var aI = 0, aL = attrStr.length; aI < aL; aI++) {
                        splitAttrRegExp.lastIndex = 0;
                        attrBuffer = splitAttrRegExp.exec(attrStr[aI]);
                        attributes.push({
                            name: attrBuffer[1].trim(),
                            value: (attrBuffer[2] || '').trim().replace(attributeQuotesExp, '')
                        });
                    }

                    ((currentObject && currentObject.childNodes) || result).push(buffer = new Node({
                        nodeType: 1, //element node
                        nodeName: fullNodeName[1],
                        namespace: fullNodeName[2],
                        attributes: attributes,
                        childNodes: [],
                        parentNode: currentObject,
                        startTag: tag,
                        selfCloseTag: selfCloseTag
                    }));
                    tagsCount++;

                    if (!onlyFirst && matchingSelector && currentObject){
                        result.push(buffer);
                    }

                    if (selfCloseTag) {
                        tagsCount--;
                    }
                    else {
                        currentObject = buffer;
                    }

                }
                else if (closeTagExp.test(tag)) {
                    if (currentObject.nodeName == fullNodeName[1]){
                        currentObject = currentObject.parentNode;
                        tagsCount--;
                    }
                }
                else {
                    currentObject.childNodes.push(new Node({
                        nodeType: 3,
                        text: tag,
                        parentNode: currentObject
                    }));
                }

                if (tagsCount == 0) {
                    composing = false;
                    currentObject = null;

                    if (onlyFirst){
                        break;
                    }
                }

            }

        }

        return onlyFirst ? result[0] || null : result;
    }


    function Dom(rawHTML) {
        this.rawHTML = rawHTML;
    }

    Dom.prototype.getElementsByClassName = function (className) {
        var selector = new RegExp('class=(\'|")(.*?\\s)?' + className + '(\\s.*?)?\\1');
        return findByRegExp(this.rawHTML, selector);
    };

    Dom.prototype.getElementsByTagName = function (tagName) {
        var selector = new RegExp('^<'+tagName, 'i');
        return findByRegExp(this.rawHTML, selector);
    };

    Dom.prototype.getElementById = function(id){
        var selector = new RegExp('id=(\'|")' + id + '\\1');
        return findByRegExp(this.rawHTML, selector, true);
    };

    Dom.prototype.getElementsByName = function(name){
        var selector = new RegExp('name=(\'|")' + name + '\\1');
        return findByRegExp(this.rawHTML, selector);
    };

    function DomParser() {
    }

    DomParser.prototype.parseFromString = function (html) {
        return new Dom(html);
    };

    FastDomParser = DomParser;
})();
