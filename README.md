# SVG-puzzle

## Usage and default values
```javascript
puzzle = new Puzzle(
    $("#puzzle")[0],
    '/path/to/img.jpg',
    {
        width:    null,
        height:   null,
        padding:  0,
        size:     {x: 2, y: 2},
        shadow:   false,
        stroke:   2,
        callback: {
            init:    null,
            destroy: null,
            resolve: null
        }
    }
);
```

## Methods
### `Boolean` isReady()
Check if puzzle was initialized.

### reinit()
Reinit puzzle.

### shuffle()
Mix the pieces of the puzzle.

### resolve()
Solve the puzzle.

### destroy()
Destroy puzzle.

### setImage(`String` src)
Set puzzle source image.

### `String` getImage()
Get puzzle source image.

### setSize(`Object` size)
Set puzzle width and height, e.g. `{width: 600, height: 300}`.

### `Object` getSize()
Get puzzle width and height.

### setGridSize(`String | Object` size)
Set puzzle grid size.
`size` may be `Object` like `{x: 4, y: 3}` or one of predefined `String`s:

Name   |x |y
----   |--|--
big    |4 |4
medium |6 |6
small  |8 |8

### `Object` getGridSize()
Set puzzle grid size.

### getElement(`String` xy)
Get one of the puzzle pieces.
`xy` — `String` like `1-1`, `1-3`...
