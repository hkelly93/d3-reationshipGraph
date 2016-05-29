'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// d3.tip
// Copyright (c) 2013 Justin Palmer
//
// Tooltips for d3.js SVG visualizations
//
// Updated by Harrison kelly.

/* global define, module, SVGElement */
(function (root, factory) {
    'use strict';

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module with d3 as a dependency.
        define(['d3'], factory);
    } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
        // CommonJS
        module.exports = function (d3) {
            d3.tip = factory(d3);
            return d3.tip;
        };
    } else {
        // Browser global.
        window.d3.tip = factory(d3);
    }
})(undefined, function (d3) {
    'use strict';

    // Public - contructs a new tooltip
    //
    // Returns a tip

    return function () {

        var direction = d3_tip_direction,
            offset = d3_tip_offset,
            html = d3_tip_html,
            node = initNode(),
            svg = null,
            point = null,
            target = null;

        /**
         * http://stackoverflow.com/a/7611054
         * @param el
         * @returns {{left: number, top: number}}
         */
        var getPageTopLeft = function getPageTopLeft(el) {
            var rect = el.getBoundingClientRect();
            var docEl = document.documentElement;
            return {
                top: rect.top + (window.pageYOffset || docEl.scrollTop || 0),
                right: rect.right + (window.pageXOffset || 0),
                bottom: rect.bottom + (window.pageYOffset || 0),
                left: rect.left + (window.pageXOffset || docEl.scrollLeft || 0)
            };
        };

        function tip(vis) {
            svg = getSVGNode(vis);
            point = svg.createSVGPoint();
            document.body.appendChild(node);
        }

        // Public - show the tooltip on the screen
        //
        // Returns a tip
        tip.show = function () {
            var args = Array.prototype.slice.call(arguments);
            if (args[args.length - 1] instanceof SVGElement) {
                target = args.pop();
            }

            var content = html.apply(this, args),
                poffset = offset.apply(this, args),
                dir = direction.apply(this, args),
                nodel = getNodeEl(),
                i = directions.length,
                coords,
                scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
                scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

            nodel.html(content).style({ opacity: 1, 'pointer-events': 'all' });

            // Figure out the correct direction.
            var node = nodel[0][0],
                nodeWidth = node.clientWidth,
                nodeHeight = node.clientHeight,
                windowWidth = window.innerWidth,
                windowHeight = window.innerHeight,
                elementCoords = getPageTopLeft(this),
                breaksTop = elementCoords.top - nodeHeight < 0,
                breaksLeft = elementCoords.left - nodeWidth < 0,
                breaksRight = elementCoords.right + nodeHeight > windowWidth,
                breaksBottom = elementCoords.bottom + nodeHeight > windowHeight;

            if (breaksTop && !breaksRight && !breaksBottom && breaksLeft) {
                // Case 1: NW
                dir = 'e';
            } else if (breaksTop && !breaksRight && !breaksBottom && !breaksLeft) {
                // Case 2: N
                dir = 's';
            } else if (breaksTop && breaksRight && !breaksBottom && !breaksLeft) {
                // Case 3: NE
                dir = 'w';
            } else if (!breaksTop && !breaksRight && !breaksBottom && breaksLeft) {
                // Case 4: W
                dir = 'e';
            } else if (!breaksTop && !breaksRight && breaksBottom && breaksLeft) {
                // Case 5: SW
                dir = 'e';
            } else if (!breaksTop && !breaksRight && breaksBottom && !breaksLeft) {
                // Case 6: S
                dir = 'e';
            } else if (!breaksTop && breaksRight && breaksBottom && !breaksLeft) {
                // Case 7: SE
                dir = 'n';
            } else if (!breaksTop && breaksRight && !breaksBottom && !breaksLeft) {
                // Case 8: E
                dir = 'w';
            }

            direction(dir);

            while (i--) {
                nodel.classed(directions[i], false);
            }

            coords = direction_callbacks.get(dir).apply(this);
            nodel.classed(dir, true).style({
                top: coords.top + poffset[0] + scrollTop + 'px',
                left: coords.left + poffset[1] + scrollLeft + 'px'
            });

            return tip;
        };

        // Public - hide the tooltip
        //
        // Returns a tip
        tip.hide = function () {
            var nodel = getNodeEl();
            nodel.style({ opacity: 0, 'pointer-events': 'none' });
            return tip;
        };

        // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
        //
        // n - name of the attribute
        // v - value of the attribute
        //
        // Returns tip or attribute value
        tip.attr = function (n) {
            if (arguments.length < 2 && typeof n === 'string') {
                return getNodeEl().attr(n);
            } else {
                var args = Array.prototype.slice.call(arguments);
                d3.selection.prototype.attr.apply(getNodeEl(), args);
            }

            return tip;
        };

        // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
        //
        // n - name of the property
        // v - value of the property
        //
        // Returns tip or style property value
        tip.style = function (n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return getNodeEl().style(n);
            } else {
                var args = Array.prototype.slice.call(arguments);
                d3.selection.prototype.style.apply(getNodeEl(), args);
            }

            return tip;
        };

        // Public: Set or get the direction of the tooltip
        //
        // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
        //     sw(southwest), ne(northeast) or se(southeast)
        //
        // Returns tip or direction
        tip.direction = function (v) {
            if (!arguments.length) {
                return direction;
            }

            direction = v == null ? v : d3.functor(v);

            return tip;
        };

        // Public: Sets or gets the offset of the tip
        //
        // v - Array of [x, y] offset
        //
        // Returns offset or
        tip.offset = function (v) {
            if (!arguments.length) {
                return offset;
            }

            offset = v == null ? v : d3.functor(v);

            return tip;
        };

        // Public: sets or gets the html value of the tooltip
        //
        // v - String value of the tip
        //
        // Returns html value or tip
        tip.html = function (v) {
            if (!arguments.length) {
                return html;
            }

            html = v == null ? v : d3.functor(v);

            return tip;
        };

        // Public: destroys the tooltip and removes it from the DOM
        //
        // Returns a tip
        tip.destroy = function () {
            if (node) {
                getNodeEl().remove();
                node = null;
            }

            return tip;
        };

        function d3_tip_direction() {
            return 'n';
        }

        function d3_tip_offset() {
            return [0, 0];
        }

        function d3_tip_html() {
            return ' ';
        }

        var direction_callbacks = d3.map({
            n: direction_n,
            s: direction_s,
            e: direction_e,
            w: direction_w,
            nw: direction_nw,
            ne: direction_ne,
            sw: direction_sw,
            se: direction_se
        }),
            directions = direction_callbacks.keys();

        function direction_n() {
            var bbox = getScreenBBox();
            return {
                top: bbox.n.y - node.offsetHeight,
                left: bbox.n.x - node.offsetWidth / 2
            };
        }

        function direction_s() {
            var bbox = getScreenBBox();
            return {
                top: bbox.s.y,
                left: bbox.s.x - node.offsetWidth / 2
            };
        }

        function direction_e() {
            var bbox = getScreenBBox();
            return {
                top: bbox.e.y - node.offsetHeight / 2,
                left: bbox.e.x
            };
        }

        function direction_w() {
            var bbox = getScreenBBox();
            return {
                top: bbox.w.y - node.offsetHeight / 2,
                left: bbox.w.x - node.offsetWidth
            };
        }

        function direction_nw() {
            var bbox = getScreenBBox();
            return {
                top: bbox.nw.y - node.offsetHeight,
                left: bbox.nw.x - node.offsetWidth
            };
        }

        function direction_ne() {
            var bbox = getScreenBBox();
            return {
                top: bbox.ne.y - node.offsetHeight,
                left: bbox.ne.x
            };
        }

        function direction_sw() {
            var bbox = getScreenBBox();
            return {
                top: bbox.sw.y,
                left: bbox.sw.x - node.offsetWidth
            };
        }

        function direction_se() {
            var bbox = getScreenBBox();
            return {
                top: bbox.se.y,
                left: bbox.e.x
            };
        }

        function initNode() {
            var node = d3.select(document.createElement('div'));
            node.style({
                position: 'absolute',
                top: 0,
                opacity: 0,
                'pointer-events': 'none',
                'box-sizing': 'border-box'
            });

            return node.node();
        }

        function getSVGNode(el) {
            el = el.node();
            if (el.tagName.toLowerCase() === 'svg') {
                return el;
            }

            return el.ownerSVGElement;
        }

        function getNodeEl() {
            if (node === null) {
                node = initNode();
                // re-add node to DOM
                document.body.appendChild(node);
            }

            return d3.select(node);
        }

        // Private - gets the screen coordinates of a shape
        //
        // Given a shape on the screen, will return an SVGPoint for the directions
        // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
        // sw(southwest).
        //
        //    +-+-+
        //    |   |
        //    +   +
        //    |   |
        //    +-+-+
        //
        // Returns an Object {n, s, e, w, nw, sw, ne, se}
        function getScreenBBox() {
            var targetel = target || d3.event.target;

            while ('undefined' === typeof targetel.getScreenCTM && 'undefined' === targetel.parentNode) {
                targetel = targetel.parentNode;
            }

            var bbox = {},
                matrix = targetel.getScreenCTM(),
                tbbox = targetel.getBBox(),
                width = tbbox.width,
                height = tbbox.height,
                x = tbbox.x,
                y = tbbox.y;

            point.x = x;
            point.y = y;
            bbox.nw = point.matrixTransform(matrix);
            point.x += width;
            bbox.ne = point.matrixTransform(matrix);
            point.y += height;
            bbox.se = point.matrixTransform(matrix);
            point.x -= width;
            bbox.sw = point.matrixTransform(matrix);
            point.y -= height / 2;
            bbox.w = point.matrixTransform(matrix);
            point.x += width;
            bbox.e = point.matrixTransform(matrix);
            point.x -= width / 2;
            point.y -= height / 2;
            bbox.n = point.matrixTransform(matrix);
            point.y += height;
            bbox.s = point.matrixTransform(matrix);

            return bbox;
        }

        return tip;
    };
});
/**
* The MIT License (MIT).
*
* Copyright (c) 2016 Harrison Kelly.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* D3-relationshipgraph - 1.5.0
*/

var RelationshipGraph = function () {

    /**
     *
     * @param {d3.selection} selection The ID of the element containing the graph.
     * @param {Object} userConfig Configuration for graph.
     * @constructor
     */

    function RelationshipGraph(selection) {
        var userConfig = arguments.length <= 1 || arguments[1] === undefined ? { showTooltips: true, maxChildCount: 0, onClick: RelationshipGraph.noop, thresholds: [] } : arguments[1];

        _classCallCheck(this, RelationshipGraph);

        // Verify that the user config contains the thresholds.
        if (userConfig.thresholds === undefined || userConfig.thresholds === null) {
            userConfig.thresholds = [];
        } else if (_typeof(userConfig.thresholds) !== 'object') {
            throw 'Thresholds must be an Object.';
        }

        /**
         * Contains the configuration for the graph.
         * @type {{blockSize: number, maxWidth: number, maxHeight: number, selection: d3.selection, showTooltips: (*|boolean),
         * maxChildCount: (*|number), onClick: (*|noop), showKeys: (*|boolean), thresholds: (*|Array), colors: (*|Array|string[]),
         * transitionTime: (*|number)}}
         */
        this.configuration = {
            blockSize: 24, // The block size for each child.
            selection: selection, // The ID for the graph.
            showTooltips: userConfig.showTooltips, // Whether or not to show the tooltips on hover.
            maxChildCount: userConfig.maxChildCount || 0, // The maximum amount of children to show per row before wrapping.
            onClick: userConfig.onClick || RelationshipGraph.noop, // The callback function to call when a child is clicked. This function gets passed the JSON for the child.
            showKeys: userConfig.showKeys, // Whether or not to show the keys in the tooltip.
            thresholds: userConfig.thresholds, // Thresholds to determine the colors of the child blocks with.
            colors: userConfig.colors || RelationshipGraph.getColors(), // Colors to use for blocks.
            transitionTime: userConfig.transitionTime || 1500, // Time for a transition to start and complete (in milliseconds).
            truncate: userConfig.truncate || 25 // Maximum length of a parent label before it gets truncated. Use 0 to turn off truncation.
        };

        if (this.configuration.showTooltips === undefined) {
            this.configuration.showTooltips = true;
        }

        if (this.configuration.showKeys === undefined) {
            this.configuration.showKeys = true;
        }

        // If the threshold array is made up of numbers, make sure that it is sorted.
        if (this.configuration.thresholds.length > 0 && typeof this.configuration.thresholds[0] == 'number') {
            this.configuration.thresholds.sort();
        }

        // Create a canvas to measure the pixel width of the parent labels.
        this.ctx = document.createElement('canvas').getContext('2d');
        this.ctx.font = '13px Helvetica';

        /**
         * Function to create the tooltip.
         *
         * @param {RelationshipGraph} self The RelationshipGraph instance.
         * @returns {d3.tooltip} the tip object.
         */
        var createTooltip = function createTooltip(self) {
            var hiddenKeys = ['ROW', 'INDEX', 'COLOR', 'PARENTCOLOR', 'PARENT'],
                showKeys = self.configuration.showKeys;

            return d3.tip().attr('class', 'relationshipGraph-tip').offset([-8, -10]).html(function (obj) {
                var keys = Object.keys(obj),
                    table = document.createElement('table'),
                    count = keys.length,
                    rows = [];

                // Loop through the keys in the object and only show values self are not in the hiddenKeys array.
                while (count--) {
                    var element = keys[count],
                        upperCaseKey = element.toUpperCase();

                    if (!RelationshipGraph.contains(hiddenKeys, upperCaseKey)) {
                        var row = document.createElement('tr'),
                            key = showKeys ? document.createElement('td') : null,
                            value = document.createElement('td');

                        if (showKeys) {
                            key.innerHTML = element.charAt(0).toUpperCase() + element.substring(1);
                            row.appendChild(key);
                        }

                        value.innerHTML = obj[element];
                        value.style.fontWeight = 'normal';

                        row.appendChild(value);
                        rows.push(row);
                    }
                }

                var rowCount = rows.length;

                while (rowCount--) {
                    table.appendChild(rows[rowCount]);
                }

                self.tooltip.direction('n');
                return table.outerHTML;
            });
        };

        this.tooltip = this.configuration.showTooltips ? createTooltip(this) : null;

        // Check if this selection already has a graph.
        this.svg = this.configuration.selection.select('svg').select('g');

        if (this.svg.empty()) {
            // Create the svg element that will contain the graph.
            this.svg = this.configuration.selection.append('svg').attr('width', '500').attr('height', '500').attr('style', 'display: block').append('g').attr('transform', 'translate(10, 0)');
        }

        this.graph = this;
    }

    /**
     * Generate the basic set of colors.
     *
     * @returns {string[]} List of HEX colors.
     */


    _createClass(RelationshipGraph, [{
        key: 'assignIndexAndRow',


        /**
         * Assign the index and row to each of the children in the Array of Objects.
         *
         * @param json {Array} The array of Objects to loop through.
         * @param parentSizes {Object} The parent sizes determined.
         * @param parents {Array} The parent label names.
         * @returns {Array} Object containing the longest width, the calculated max children per row, and the maximum amount
         *  of rows.
         */
        value: function assignIndexAndRow(json, parentSizes, parents) {
            // Determine the longest parent name to calculate how far from the left the child blocks should start.
            var longest = '',
                parentNames = Object.keys(parentSizes),
                i = void 0,
                index = 0,
                row = 0,
                previousParent = '';

            for (i = 0; i < parents.length; i++) {
                var current = parents[i] + ' ( ' + parentSizes[parentNames[i]] + ') ';

                if (current.length > longest.length) {
                    longest = current;
                }
            }

            // Calculate the row and column for each child block.
            var longestWidth = this.ctx.measureText(longest).width,
                parentDiv = this.configuration.selection[0][0],
                calculatedMaxChildren = this.configuration.maxChildCount === 0 ? Math.floor((parentDiv.parentElement.clientWidth - 15 - longestWidth) / this.configuration.blockSize) : this.configuration.maxChildCount;

            for (i = 0; i < json.length; i++) {
                var element = json[i],
                    parent = element.parent;

                if (previousParent !== null && previousParent !== parent) {
                    element.row = ++row;
                    element.index = 1;
                    index = 2;
                } else {
                    if (index === calculatedMaxChildren + 1) {
                        index = 1;
                        row++;
                    }

                    element.row = row;
                    element.index = index;

                    index++;
                }

                previousParent = parent;

                if (this.configuration.thresholds.length === 0) {
                    element.color = 0;
                } else {
                    // Figure out the color based on the threshold.
                    var value = void 0,
                        compare = void 0;

                    if (typeof this.configuration.thresholds[0] === 'string') {
                        value = element.value;

                        /**
                         * Compare the values to see if they're equal.
                         *
                         * @param value {String} The value from the JSON.
                         * @param threshold {String} The threshold from the JSON.
                         * @returns {boolean} Whether or not the two are equal.
                         */
                        compare = function compare(value, threshold) {
                            return value == threshold;
                        };
                    } else {
                        value = typeof element.value == 'number' ? element.value : parseInt(element.value.replace(/\D/g, ''));

                        /**
                         * Compare the values to see if the value is less than the threshold.
                         *
                         * @param value {number} The value from the JSON.
                         * @param threshold {number} The threshold from the JSON.
                         * @returns {boolean} Whether or not the value is less than the threshold.
                         */
                        compare = function compare(value, threshold) {
                            return value < threshold;
                        };
                    }

                    for (var thresholdIndex = 0; thresholdIndex < this.configuration.thresholds.length; thresholdIndex++) {
                        if (compare(value, this.configuration.thresholds[thresholdIndex])) {
                            element.color = thresholdIndex;
                            break;
                        }
                    }
                }
            }

            return [longestWidth, calculatedMaxChildren, row];
        }

        /**
         * Verify that the JSON passed in is correct.
         *
         * @param json {Array} The array of JSON objects to verify.
         */

    }, {
        key: 'data',


        /**
         * Generate the graph.
         *
         * @param json {Array} The array of JSON to feed to the graph.
         * @return {RelationshipGraph} The RelationshipGraph object to keep d3's chaining functionality.
         */
        value: function data(json) {
            var _this2 = this;

            if (RelationshipGraph.verifyJson(json)) {
                (function () {
                    var row = 1,
                        parents = [],
                        parentSizes = {},
                        previousParentSizes = 0,
                        _this = _this2,
                        parent = void 0,
                        i = void 0,
                        maxWidth = void 0,
                        maxHeight = void 0,
                        calculatedMaxChildren = 0,
                        longestWidth = 0;

                    // Ensure that the JSON is sorted by parent.
                    RelationshipGraph.sortJson(json);

                    // Loop through all of the childrenNodes in the JSON array and determine the amount of childrenNodes per parent. This will also
                    // calculate the row and index for each block and truncate the parent names to 25 characters.
                    for (i = 0; i < json.length; i++) {
                        parent = json[i].parent;

                        if (RelationshipGraph.containsKey(parentSizes, parent)) {
                            parentSizes[parent]++;
                        } else {
                            parentSizes[parent] = 1;
                            parents.push(RelationshipGraph.truncate(parent, _this2.configuration.truncate));
                        }
                    }

                    // Assign the indexes and rows to each child. This method also calculates the maximum amount of children per row, the longest
                    // row width, and how many rows there are.


                    // Set the max width and height.

                    var _assignIndexAndRow = _this2.assignIndexAndRow(json, parentSizes, parents);

                    var _assignIndexAndRow2 = _slicedToArray(_assignIndexAndRow, 3);

                    longestWidth = _assignIndexAndRow2[0];
                    calculatedMaxChildren = _assignIndexAndRow2[1];
                    row = _assignIndexAndRow2[2];
                    maxHeight = row * _this2.configuration.blockSize;
                    maxWidth = longestWidth + calculatedMaxChildren * _this2.configuration.blockSize;

                    // Select all of the parent nodes.
                    var parentNodes = _this2.svg.selectAll('.relationshipGraph-Text').data(parents);

                    // Add new parent nodes.
                    parentNodes.enter().append('text').text(function (obj, index) {
                        return obj + ' (' + parentSizes[Object.keys(parentSizes)[index]] + ')';
                    }).attr('x', function (obj, index) {
                        var width = _this.ctx.measureText(obj + ' (' + parentSizes[Object.keys(parentSizes)[index]] + ')');
                        return longestWidth - width.width;
                    }).attr('y', function (obj, index) {
                        if (index === 0) {
                            return 0;
                        }

                        // Determine the Y coordinate by determining the Y coordinate of all of the parents before.
                        var y = Math.ceil(previousParentSizes / calculatedMaxChildren) * _this.configuration.blockSize;
                        previousParentSizes += y;

                        return y;
                    }).style('text-anchor', 'start').style('fill', function (obj) {
                        return obj.parentColor !== undefined ? _this.configuration.colors[obj.parentColor] : '#000000';
                    }).attr('class', 'relationshipGraph-Text').attr('transform', 'translate(-6, ' + _this2.configuration.blockSize / 1.5 + ')');

                    // Update existing parent nodes.
                    parentNodes.text(function (obj, index) {
                        return obj + ' (' + parentSizes[Object.keys(parentSizes)[index]] + ')';
                    }).attr('x', function (obj, index) {
                        var width = _this.ctx.measureText(obj + ' (' + parentSizes[Object.keys(parentSizes)[index]] + ')');
                        return longestWidth - width.width;
                    }).attr('y', function (obj, index) {
                        if (index === 0) {
                            return 0;
                        }

                        // Determine the Y coordinate by determining the Y coordinate of all of the parents before. This has to be calculated completely
                        // because it is an update and can occur anywhere.
                        var previousParentSize = 0,
                            i = index - 1;

                        while (i > -1) {
                            previousParentSize += Math.ceil(parentSizes[Object.keys(parentSizes)[i]] / calculatedMaxChildren) * calculatedMaxChildren;
                            i--;
                        }

                        return Math.ceil(previousParentSize / calculatedMaxChildren) * _this.configuration.blockSize;
                    }).style('fill', function (obj) {
                        return obj.parentColor !== undefined ? _this.configuration.colors[obj.parentColor] : '#000000';
                    });

                    // Remove deleted parent nodes.
                    parentNodes.exit().remove();

                    // Select all of the children nodes.
                    var childrenNodes = _this2.svg.selectAll('.relationshipGraph-block').data(json);

                    // Add new child nodes.
                    childrenNodes.enter().append('rect').attr('x', function (obj) {
                        return longestWidth + (obj.index - 1) * _this.configuration.blockSize;
                    }).attr('y', function (obj) {
                        return (obj.row - 1) * _this.configuration.blockSize;
                    }).attr('rx', 4).attr('ry', 4).attr('class', 'relationshipGraph-block').attr('width', _this.configuration.blockSize).attr('height', _this.configuration.blockSize).style('fill', function (obj) {
                        return _this.configuration.colors[obj.color % _this.configuration.colors.length] || _this.configuration.colors[0];
                    }).on('mouseover', _this.tooltip ? _this.tooltip.show : RelationshipGraph.noop).on('mouseout', _this.tooltip ? _this.tooltip.hide : RelationshipGraph.noop).on('click', function (obj) {
                        _this.tooltip.hide();
                        _this.configuration.onClick(obj);
                    });

                    // Update existing child nodes.
                    childrenNodes.transition(_this.configuration.transitionTime).attr('x', function (obj) {
                        return longestWidth + (obj.index - 1) * _this.configuration.blockSize;
                    }).attr('y', function (obj) {
                        return (obj.row - 1) * _this.configuration.blockSize;
                    }).style('fill', function (obj) {
                        return _this.configuration.colors[obj.color % _this.configuration.colors.length] || _this.configuration.colors[0];
                    });

                    // Delete removed child nodes.
                    childrenNodes.exit().transition(_this.configuration.transitionTime).remove();

                    if (_this2.configuration.showTooltips) {
                        d3.select('.d3-tip').remove();
                        _this2.svg.call(_this2.tooltip);
                    }

                    _this2.configuration.selection.select('svg').attr('width', maxWidth + 15).attr('height', maxHeight + 15);
                })();
            }

            return this;
        }
    }], [{
        key: 'getColors',
        value: function getColors() {
            return ['#c4f1be', '#a2c3a4', '#869d96', '#525b76', '#201e50', '#485447', '#5b7f77', '#6474ad', '#b9c6cb', '#c0d6c1', '#754668', '#587d71', '#4daa57', '#b5dda4', '#f9eccc', '#0e7c7b', '#17bebb', '#d4f4dd', '#d62246', '#4b1d3f', '#cf4799', '#c42583', '#731451', '#f3d1bf', '#c77745'];
        }

        /**
         * Checks if the object contains the key.
         *
         * @param {object} obj The object to check in.
         * @param {string} key They key to check for.
         * @returns {boolean} Whether or not the object contains the key.
         */

    }, {
        key: 'containsKey',
        value: function containsKey(obj, key) {
            return Object.keys(obj).indexOf(key) > -1;
        }

        /**
         * Checks whether or not the key is in the array.
         *
         * @param {*[]} arr The array to check in.
         * @param {string} key The key to check for.
         * @returns {boolean} Whether or not the key exists in the array.
         */

    }, {
        key: 'contains',
        value: function contains(arr, key) {
            return arr.indexOf(key) > -1;
        }

        /**
         * Truncate a string to 25 characters plus an ellipses.
         *
         * @param {string} str The string to truncate.
         * @param {number} cap The number to cap the string at before it gets truncated.
         * @returns {string} The string truncated (if necessary).
         */

    }, {
        key: 'truncate',
        value: function truncate(str, cap) {
            if (cap === 0) {
                return str;
            }

            return str.length > cap ? str.substring(0, cap) + '...' : str;
        }

        /**
         * Determines if the array passed in is an Array object.
         *
         * @param arr {Array} The array object to check.
         * @returns {boolean} Whether or not the array is actually an array object.
         */

    }, {
        key: 'isArray',
        value: function isArray(arr) {
            return Object.prototype.toString.call(arr) == '[object Array]';
        }

        /**
         * Noop function.
         */

    }, {
        key: 'noop',
        value: function noop() {}

        /**
         * Returns a sorted Array.
         *
         * @param json {Array} The Array to be sorted.
         */

    }, {
        key: 'sortJson',
        value: function sortJson(json) {
            json.sort(function (child1, child2) {
                var parent1 = child1.parent.toLowerCase(),
                    parent2 = child2.parent.toLowerCase();

                return parent1 > parent2 ? 1 : parent1 < parent2 ? -1 : 0;
            });
        }
    }, {
        key: 'verifyJson',
        value: function verifyJson(json) {
            if (!RelationshipGraph.isArray(json) || json.length < 0 || _typeof(json[0]) !== 'object') {
                throw 'JSON has to be an Array of JavaScript objects that is not empty.';
            }

            var length = json.length;

            while (length--) {
                var element = json[length],
                    keys = Object.keys(element),
                    keyLength = keys.length;

                if (element.parent === undefined) {
                    throw 'Child does not have a parent.';
                } else if (element.parentColor !== undefined && (element.parentColor > 4 || element.parentColor < 0)) {
                    throw 'Parent color is unsupported.';
                }

                while (keyLength--) {
                    if (keys[keyLength].toUpperCase() == 'VALUE') {
                        if (keys[keyLength] != 'value') {
                            json[length].value = json[length][keys[keyLength]];
                            delete json[length][keys[keyLength]];
                        }
                        break;
                    }
                }
            }

            return true;
        }
    }]);

    return RelationshipGraph;
}();

/**
 * Add a relationshipGraph function to d3 that returns a RelationshipGraph object.
 */


d3.relationshipGraph = function () {
    'use strict';

    return RelationshipGraph.extend.apply(RelationshipGraph, arguments);
};

/**
 * Add relationshipGraph to selection.
 *
 * @param {Object} userConfig Configuration for graph.
 * @return {Object} Returns a new RelationshipGraph object.
 */
d3.selection.prototype.relationshipGraph = function (userConfig) {
    'use strict';

    return new RelationshipGraph(this, userConfig);
};

/**
 * Add relationshipGraph to enter.
 *
 * @returns {RelationshipGraph} RelationshipGraph object.
 */
d3.selection.enter.prototype.relationshipGraph = function () {
    'use strict';

    return this.graph;
};
