/**
 * Puzzle.
 * @author edmitriev
 */
"use strict";

var Puzzle = function(element, src, options) {
    if (!window.Snap) {
        console.error("Snap.svg required.");
        return;
    }

    var self   = this,
        puzzle = {
            /**
             * Check if puzzle ready.
             */
            isReady: function() {
                return self.isReady;
            },

            /**
             * Set image.
             */
            setImage: function(src) {
                this.destroy();
                
                self.src = src;
                self.init(self.src);

                return this;
            },

            /**
             * Get image.
             */
            getImage: function() {
                return self.src;
            },

            /**
             * Set size.
             */
            setSize: function(size) {
                self.paperWidth  = size.width || self.paperWidth;
                self.paperHeight = size.height || self.paperHeight;

                self.paper.attr({
                    width:  self.paperWidth,
                    height: self.paperHeight
                });

                return this;
            },

            /**
             * Get size
             */
            getSize: function() {
                return {
                    width:  self.paperWidth,
                    height: self.paperHeight
                };
            },

            /**
             * Set grid size.
             */
            setGridSize: function(size) {
                if (size !== self.options.size) {
                    self.options.size = self.getGridSize(size);
                    this.reinit();
                }

                return this;
            },

            /**
             * Get grid size.
             */
            getGridSize: function() {
                return self.options.size;
            },

            /**
             * Get path element by x-y.
             */
            getElement: function(xy) {
                return self.getElement(xy);
            },

            /**
             * Reinit puzzle.
             */
            reinit: function() {
                this.destroy();
                self.init(self.src);

                return this;
            },

            /**
             * Shuffle image.
             */
            shuffle: function() {
                self.shuffle();

                return this;
            },

            /**
             * Resolve puzzle.
             */
            resolve: function() {
                var resolvedGroup = self.paper.g().addClass("resolved"),
                    piecesLength  = self.pieces.length
                ;

                for (var i = 0; i < piecesLength; i++) {
                    var piece = self.pieces[i];

                    piece
                        .transform("T0,0")
                        .attr("filter", null)
                        .undrag()
                        .appendTo(resolvedGroup)
                    ;
                }

                self.groups.elements.selectAll("g").remove();
                self.groups.elements.append(resolvedGroup);

                if ("function" == typeof(self.options.callback.resolve)) {
                    self.options.callback.resolve.apply(this);
                }

                return this;
            },

            /**
             * Destroy puzzle.
             */
            destroy: function() {
                if (self.paper) {
                    self.paper.clear();
                    self.paper.remove();

                    self.paper = null;
                }

                self.pieces = [];

                if ("function" == typeof(self.options.callback.destroy)) {
                    self.options.callback.destroy.apply(this);
                }

                return this;
            }
        }
    ;

    self.isReady = false;

    /**
     * Init puzzle.
     */
    self.init = function(src) {
        var img  = new Image(),
            that = this
        ;

        self.isReady = false;

        img.onload = function() {
            var ratio  = 1,
                xRatio = 1,
                yRatio = 1
            ;

            if (self.options.width && self.options.width < this.width) {
                xRatio = self.options.width / this.width;
            }

            if (self.options.height && self.options.height < this.height) {
                yRatio = self.options.height / this.height;
            }

            ratio = Math.min(xRatio, yRatio);

            self.ratio       = ratio;
            self.paperWidth  = self.options.padding * 2 + (self.options.width ? self.options.width : this.width * ratio);
            self.paperHeight = self.options.padding * 2 + (self.options.height ? self.options.height : this.height * ratio);
            self.width       = this.width * ratio;
            self.height      = this.height * ratio;

            delete this;

            self.initPaper();
            self.splitImage();
            self.shuffle();

            self.isReady = true;

            if ("function" == typeof(self.options.callback.init)) {
                self.options.callback.init.apply(puzzle);
            }
        };

        img.src = src;
    };

    /**
     * Init SVG paper.
     */
    self.initPaper = function() {
        if (null === this.paper) {
            this.paper = Snap(this.paperWidth, this.paperHeight);
            this.paper.attr("viewBox", "0,0," + this.paperWidth + "," + this.paperHeight);

            this.groups = {
                elements: this.paper.g(),
                move:     this.paper.g()
            };

            //this.paper.attr("viewBox", (this.paperWidth - this.width) / 2 + "," + (this.paperHeight - this.height) / 2 + "," + this.width + "," + this.height);
            this.element.appendChild(this.paper.node);

            var shadow = this.getShadow();

            /**
             * Neighbors plugin.
             */
            Snap.plugin(function(Snap, Element, Paper, global) {
                Element.prototype.setNeighborsIds = function(/** Arrays of neighbors Ids. */) {
                    var neighbors = [],
                        array     = Array.prototype.concat.apply([], arguments),
                        length    = array.length
                    ;

                    while (length--) {
                        var el = array[length];

                        if (-1 === neighbors.indexOf(el)) {
                            neighbors.unshift(el);
                        }
                    }

                    this.neighbors = neighbors.sort();

                    return this;
                };

                Element.prototype.addNeighborsIds = function(/** Arrays of neighbors Ids. */) {
                    return this.setNeighborsIds(
                        this.getNeighborsIds(),
                        Array.prototype.concat.apply([], arguments)
                    );
                };

                Element.prototype.getNeighborsIds = function() {
                    return this.neighbors;
                };

                Element.prototype.getNeighbors = function() {
                    var length    = this.neighbors.length,
                        neighbors = []
                    ;

                    for (var i = 0; i < length; i++) {
                        var neighbor = this.puzzle.getElement(this.neighbors[i]);

                        if (neighbor && ("g" != this.type || this != neighbor.parent())) {
                            neighbors.push(neighbor);
                        }
                    }

                    return neighbors;
                };

                Element.prototype.stickToNeighbors = function() {
                    var neighbors  = this.getNeighbors(),
                        length     = neighbors.length,
                        matrix     = this.transform().totalMatrix,
                        xThreshold = this.puzzle.width / this.puzzle.options.size.x * .2,
                        yThreshold = this.puzzle.height / this.puzzle.options.size.y * .2
                    ;

                    for (var i = 0; i < length; i++) {
                        var neighbor = neighbors[i],
                            nParent  = neighbor.parent(),
                            nMatrix  = neighbor.transform().totalMatrix,
                            xDelta   = Math.abs(nMatrix.e - matrix.e),
                            yDelta   = Math.abs(nMatrix.f - matrix.f)
                        ;

                        if (xDelta <= xThreshold && yDelta <= yThreshold) {
                            if ("g" == this.type) {
                                if (
                                    "g" == nParent.type &&
                                    nParent.hasClass("resolved")
                                ) {
                                    this.selectAll("path").forEach(function(el) {
                                        el.appendTo(nParent);
                                    });

                                    nParent.addNeighborsIds(this.getNeighborsIds());

                                    this.remove();

                                    break;

                                } else {
                                    neighbor
                                        .transform("T0,0")
                                        .attr("filter", null)
                                        .undrag()
                                    ;

                                    this
                                        .transform("T" + nMatrix.e + "," + nMatrix.f)
                                        .append(neighbor)
                                        .addNeighborsIds(neighbor.getNeighborsIds())
                                    ;

                                    break;
                                }

                            } else {
                                if (
                                    "g" == nParent.type &&
                                    nParent.hasClass("resolved")
                                ) {
                                    this
                                        .transform("T0,0")
                                        .attr("filter", null)
                                        .undrag()
                                    ;

                                    nParent
                                        .append(this)
                                        .addNeighborsIds(this.getNeighborsIds())
                                    ;

                                    break;

                                } else {
                                    this
                                        .transform("T0,0")
                                        .attr("filter", null)
                                        .undrag()
                                    ;

                                    neighbor
                                        .transform("T0,0")
                                        .attr("filter", null)
                                        .undrag()
                                    ;

                                    var group = this.puzzle.paper.g(this, neighbor)
                                        .transform("T" + nMatrix.e + "," + nMatrix.f)
                                        .attr("filter", shadow)
                                        .addClass("resolved")
                                        .puzzleDrag()
                                        .setNeighborsIds(
                                            this.getNeighborsIds(),
                                            neighbor.getNeighborsIds()
                                        )
                                    ;

                                    group.puzzle = this.puzzle;

                                    this.puzzle.groups.elements.add(group);

                                    break;
                                }
                            }
                        }
                    }
                };
            });

            /**
             * Puzzle drag plugin.
             */
            Snap.plugin(function(Snap, Element, Paper, global) {
                Element.prototype.puzzleDrag = function() {
                    this.drag(dragMove, dragStart, dragEnd);
                    return this;
                };

                var dragStart = function(x, y, evt) {
                    this
                        .appendTo(this.puzzle.groups.move)
                        .attr("filter", shadow)
                    ;

                    this.dragStartX = evt.clientX;
                    this.dragStartY = evt.clientY;
                    this.data("ot", this.transform().local);
                };

                var dragMove = function(dx, dy, x, y, evt) {
                    var dx = evt.clientX - this.dragStartX,
                        dy = evt.clientY - this.dragStartY
                    ;

                    var invMatrix = this.transform().diffMatrix.invert();

                    invMatrix.e = invMatrix.f = 0;

                    this.transform(this.data("ot") + "t" + invMatrix.x(dx, dy) + "," + invMatrix.y(dx, dy));
                };

                var dragEnd = function() {
                    this
                        .appendTo(this.puzzle.groups.elements)
                        .stickToNeighbors()
                    ;

                    this.puzzle.checkResolved();
                };
            });
        }
    };

    /**
     * Get shadow.
     */
    self.getShadow = function() {
        return this.options.shadow
            ? this.paper.filter(Snap.filter.shadow(2, 2, 2))
            : null
        ;
    };

    /**
     * Split image.
     */
    self.splitImage = function() {
        var gridSize   = this.getGridSize(this.options.size),
            gridShapes = this.getGridShapes(gridSize.x, gridSize.y)
        ;

        this.prepareGridPieces(gridSize, gridShapes);
    };

    /**
     * Get grid size.
     */
    self.getGridSize = function(size) {
        if (size) {
            if ("string" == typeof(size) && this.sizes[size]) {
                return this.sizes[size];
            }

            if (
                "object" == typeof(size) &&
                size.x && size.x > 1 &&
                size.y && size.y > 1
            ) {
                return size;
            }
        }

        return {
            x: 2,
            y: 2
        };
    };

    /**
     * Get shapes of pieces.
     */
    self.getGridShapes = function(xSize, ySize) {
        var shapes   = [],
            getShape = function(x, y, xSize, ySize) {
                if (shapes[y * xSize + x]) {
                    return shapes[y * xSize + x];
                }

                shapes[y * xSize + x] = {
                    x:      x,
                    y:      y,
                    top:    (0 == y ? 0 : null),
                    right:  (xSize - 1 == x ? 0 : null),
                    bottom: (ySize - 1 == y ? 0 : null),
                    left:   (0 == x ? 0 : null)
                };

                return shapes[y * xSize + x];
            }
        ;

        for (var y = 0; y < ySize; y++) {
            for (var x = 0; x < xSize; x++) {
                var shape      = getShape(x, y, xSize, ySize),
                    rightShape = (x < xSize - 1)
                        ? getShape(x + 1, y, xSize, ySize)
                        : null,
                    bottomShape = (y < ySize - 1)
                        ? getShape(x, y + 1, xSize, ySize)
                        : null
                ;

                shape.right = (x < xSize - 1)
                    ? Math.pow(-1, Math.floor(Math.random() * 2))
                    : shape.right
                ;

                if (rightShape) {
                    rightShape.left = shape.right;
                }

                shape.bottom = (y < ySize - 1)
                    ? Math.pow(-1, Math.floor(Math.random() * 2))
                    : shape.bottom
                ;

                if (bottomShape) {
                    bottomShape.top = -shape.bottom;
                }
            }
        }

        return shapes;
    };

    /**
     * Get shape curve path.
     */
    self.getShapePath = function(shape, width, height) {
        var coords = [
                0, 0, 35, 15, 37, 5,
                37, 5, 40, 0, 38, -5,
                38, -5, 20, -20, 50, -20,
                50, -20, 80, -20, 62, -5,
                62, -5, 60, 0, 63, 5,
                63, 5, 65, 15, 100, 0
            ],
            xOffset = self.options.padding + shape.x * width,
            yOffset = self.options.padding + shape.y * height,
            xRatio  = width / 100,
            yRatio  = height / 100,
            path    = []
        ;

        path.push("M" + xOffset + "," + yOffset);

        /**
         * Top border.
         */
        for (var i = 0; i < coords.length / 6; i++) {
            path.push("C" + [
                [
                    xOffset + coords[i * 6 + 0] * xRatio,
                    yOffset + shape.top * coords[i * 6 + 1] * yRatio
                ].join(","),
                [
                    xOffset + coords[i * 6 + 2] * xRatio,
                    yOffset + shape.top * coords[i * 6 + 3] * yRatio
                ].join(","),
                [
                    xOffset + coords[i * 6 + 4] * xRatio,
                    yOffset + shape.top * coords[i * 6 + 5] * yRatio
                ].join(",")
            ].join(" "));
        }

        /**
         * Right border.
         */
        for (var i = 0; i < coords.length / 6; i++) {
            path.push("C" + [
                [
                    xOffset + width - shape.right * coords[i * 6 + 1] * xRatio,
                    yOffset + coords[i * 6 + 0] * yRatio
                ].join(","),
                [
                    xOffset + width - shape.right * coords[i * 6 + 3] * xRatio,
                    yOffset + coords[i * 6 + 2] * yRatio
                ].join(","),
                [
                    xOffset + width - shape.right * coords[i * 6 + 5] * xRatio,
                    yOffset + coords[i * 6 + 4] * yRatio
                ].join(",")
            ].join(" "));
        }

        /**
         * Bottom border.
         */
        for (var i = 0; i < coords.length / 6; i++) {
            path.push("C" + [
                [
                    xOffset + width - coords[i * 6 + 0] * xRatio,
                    yOffset + height - shape.bottom * coords[i * 6 + 1] * yRatio
                ].join(","),
                [
                    xOffset + width - coords[i * 6 + 2] * xRatio,
                    yOffset + height - shape.bottom * coords[i * 6 + 3] * yRatio
                ].join(","),
                [
                    xOffset + width - coords[i * 6 + 4] * xRatio,
                    yOffset + height - shape.bottom * coords[i * 6 + 5] * yRatio
                ].join(",")
            ].join(" "));
        }

        /**
         * Left border.
         */
        for (var i = 0; i < coords.length / 6; i++) {
            path.push("C" + [
                [
                    xOffset - shape.left * coords[i * 6 + 1] * xRatio,
                    yOffset + height - coords[i * 6 + 0] * yRatio
                ].join(","),
                [
                    xOffset - shape.left * coords[i * 6 + 3] * xRatio,
                    yOffset + height - coords[i * 6 + 2] * yRatio
                ].join(","),
                [
                    xOffset - shape.left * coords[i * 6 + 5] * xRatio,
                    yOffset + height - coords[i * 6 + 4] * yRatio
                ].join(",")
            ].join(" "));
        }

        path.push("Z");

        return path.join(" ");
    };

    /**
     * Prepare pieces.
     */
    self.prepareGridPieces = function(size, shapes) {
        var shapesLength = shapes.length,
            self    = this,
            width   = this.width / size.x,
            height  = this.height / size.y,
            imgOffset = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) ? 0 : this.options.padding,
            pattern = this.paper.image(
                this.src,
                imgOffset, imgOffset,
                this.width, this.height
            ).pattern(
                this.options.padding, this.options.padding,
                this.width, this.height
            ),
            path
        ;

        for (var i = 0; i < shapesLength; i++) {
            var shape = shapes[i];

            path = this.paper
                .path(this.getShapePath(shape, width, height))
                .attr({
                    "id":             this.paper.id + "-" + shape.x + "-" + shape.y,
                    "fill":           pattern,
                    "filter":         this.getShadow(),
                    "stroke-width":   this.options.stroke,
                    "stroke":         "#000000",
                    "stroke-opacity": 0.3
                })
            ;

            path.shape     = shape;
            path.puzzle    = this;
            path.neighbors = [];

            /** Top */
            if (shape.y > 0) {
                path.neighbors.push(shape.x + "-" + (shape.y - 1));
            }

            /** Right */
            if (shape.x < size.x - 1) {
                path.neighbors.push((shape.x + 1) + "-" + shape.y);
            }

            /** Bottom */
            if (shape.y < size.y - 1) {
                path.neighbors.push(shape.x + "-" + (shape.y + 1));
            }

            /** Left */
            if (shape.x > 0) {
                path.neighbors.push((shape.x - 1) + "-" + shape.y);
            }

            path.puzzleDrag();

            this.groups.elements.add(path);
            this.pieces.push(path);
        }
    };

    /**
     * Check if puzzle is resolved.
     */
    self.checkResolved = function() {
        var group = this.groups.elements.select("g");

        if (
            !this.resolved && group &&
            group.selectAll("path").length == this.groups.elements.selectAll("path").length
        ) {
            this.resolved = true;

            group
                .transform("T" + (this.paperWidth - this.options.padding * 2 - this.width) / 2 + "," + (this.paperHeight -this.options.padding * 2 - this.height) / 2)
                .undrag()
            ;

            if ("function" == typeof(this.options.callback.resolve)) {
                this.options.callback.resolve.apply(puzzle);
            }
        }
    };

    /**
     * Shuffle image pieces.
     */
    self.shuffle = function() {
        this.resolved = false;

        var piecesLength = this.pieces.length;

        for (var i = 0; i < piecesLength; i++) {
            var piece = this.pieces[i],
                invMatrix, bbox, x, y
            ;

            piece.appendTo(this.groups.elements);

            invMatrix = piece.transform().diffMatrix.invert(),
            invMatrix.e = invMatrix.f = 0;

            bbox = piece.getBBox();
            x    = Math.random() * (this.paperWidth - bbox.width) - invMatrix.x(bbox.x, bbox.y);
            y    = Math.random() * (this.paperHeight - bbox.height) - invMatrix.y(bbox.x, bbox.y);

            piece
                .transform(piece.transform().local + "t" + x + "," + y)
                .puzzleDrag()
            ;
        }

        this.groups.elements.selectAll("g").remove();
    };

    /**
     * Get path element by x-y.
     */
    self.getElement = function(xy) {
        var piecesLength = this.pieces.length;

        for (var i = 0; i < piecesLength; i++) {
            var piece = this.pieces[i];

            if (this.paper.id + "-" + xy == piece.attr("id")) {
                return piece;
            }
        }

        return null;
    };

    self.element  = element;
    self.src      = src;
    self.paper    = null;
    self.pieces   = [];
    self.resolved = false;
    self.sizes    = {
        big:    {x: 4, y: 4},
        medium: {x: 6, y: 6},
        small:  {x: 8, y: 8}
    };
    self.options  = {
        width:    options.width ? options.width - (options.padding || 0) * 2 : null,
        height:   options.height ? options.height - (options.padding || 0) *2 : null,
        padding:  options.padding || 0,
        size:     self.getGridSize(options.size),
        shadow:   options.shadow || false,
        stroke:   options.stroke || 2,
        callback: {
            init:    options.callback.init || null,
            destroy: options.callback.destroy || null,
            resolve: options.callback.resolve || null
        }
    };

    self.init(src);

    return puzzle;
};
