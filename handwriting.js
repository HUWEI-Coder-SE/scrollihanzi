// /*                    handwriting                       */
//
// const defaults = {
//     canvas_width: 88,
//     character_set: 'simplified',
//     double_tap_speed: 500,
//     max_adds: 20,
//     max_reviews: 200,
//     paper_filter: true,
//     reveal_order: true,
//     revisit_failures: true,
//     show_regrading_icon: true,
//     snap_strokes: true,
//   };
//
//   const screenWidth = window.innerWidth;
//   const screenHeight = window.innerHeight;
//
//   // const kCanvasSize = 512;
//   const kCanvasSize = screenWidth*0.4<screenHeight*0.6 ? screenWidth*0.4:screenHeight*0.6;
//
//   const kCornerSize = 1 / 8;
//   const kCrossWidth = 1 / 256;
//   const kMinDistance = 1 / 32;
//   const kStrokeWidth = 1 / 32;
//
//   const kBrushColor   = '#888888';
//   const kHintColor    = '#00c0ff';
//   const kRevealColor  = '#cccccc';
//   const kStrokeColor  = '#000000';
//
//   // Colors for EXCELLENT, GOOD, FAIR, and POOR result values.
//   const kResultColors = ['#84b4d8', '#88c874', '#c0c080', '#e87878'];
//
//
//
//   let ticker = null;
//
//   // Helper methods used by the handwriting class.
//
//   const angle = (xs) => Math.atan2(xs[1][1] - xs[0][1], xs[1][0] - xs[0][0]);
//
//
//   //这段代码定义了一个名为 animate 的函数，它接受五个参数：shape（形状对象）、size（大小）、rotate（是否旋转）、source（源点坐标）和 target（目标点坐标）。函数的作用是根据源点和目标点的位置来设置形状对象的属性，以实现动画效果。
//   const animate = (shape, size, rotate, source, target) => {
//     shape.regX = size * (target[0][0] + target[1][0]) / 2;
//     shape.regY = size * (target[0][1] + target[1][1]) / 2;
//     shape.x = size * (source[0][0] + source[1][0]) / 2;
//     shape.y = size * (source[0][1] + source[1][1]) / 2;
//     const scale = distance(source) / (distance(target) + kMinDistance);
//     shape.scaleX = scale;
//     shape.scaleY = scale;
//     if (rotate) {
//       const rotation = (180 / Math.PI) * (angle(source) - angle(target));
//       shape.rotation = ((Math.round(rotation) + 540) % 360) - 180;
//     }
//     return {rotation: 0, scaleX: 1, scaleY: 1, x: shape.regX, y: shape.regY};
//   }
//
//   const convertShapeStyles = (shape, end) => {
//     if (!shape.graphics || !shape.graphics.instructions) {
//       return;
//     }
//     let updated = false;
//     for (let instruction of shape.graphics.instructions) {
//       if (instruction.style) {
//         instruction.style = end;
//         updated = true;
//       }
//     }
//     if (updated) shape.updateCache();
//   }
//
//   const createCanvas = (element, handwriting) => {
//     const canvas = document.getElementById("practiceCanvas");
//
//     canvas.width = canvas.height = kCanvasSize;
//     //将canvas.style.width和canvas.style.height设置为和element相同
//     // canvas.style.width = canvas.style.height = `${element.width()}px`;
//     canvas.style.width = canvas.style.height = `${element.style.width}px`;
//     // console.log(typeof element);
//     // element.append(canvas);
//     // element.appendChild(canvas);
//
//     const touch_supported = 'ontouchstart' in window;
//     const zoom = kCanvasSize / element.style.width;
//
//     const getPosition = (event) => {
//       if (touch_supported) event = event.touches[0];
//       if (!event) return;
//       const bound = canvas.getBoundingClientRect();
//       const point = [event.clientX - bound.left, event.clientY - bound.top];
//       // console.log(point);
//       // console.log(kCanvasSize,element.style.width);
//     //   return point.map((x) => Math.round(zoom * x));
//       return point.map((x) => Math.round(x));
//     }
//
//     let mousedown = false;
//
//     // 摸出区域
//     canvas.ontouchcancel = function (e) {
//         mousedown = false;
//     }
//
//     // const start_event = touch_supported ? 'touchstart' : 'mousedown';
//     canvas.addEventListener('mousedown', (event) => {
//       mousedown = true;
//       if (event.cancelable) event.preventDefault();
//       handwriting._pushPoint(getPosition(event));
//     });
//
//     canvas.addEventListener('touchstart', (event) => {
//         mousedown = true;
//         if (event.cancelable) event.preventDefault();
//         handwriting._pushPoint(getPosition(event));
//       });
//
//
//
//     // const move_event = touch_supported ? 'touchmove' : 'mousemove';
//     canvas.addEventListener('touchmove', (event) => {
//       if (!mousedown) return;
//       handwriting._pushPoint(getPosition(event));
//     }, {passive: true});
//
//     canvas.addEventListener('mousemove', (event) => {
//         if (!mousedown) return;
//         handwriting._pushPoint(getPosition(event));
//       }, {passive: true});
//
//     // const end_event = touch_supported ? 'touchend' : 'mouseup';
//
//     canvas.addEventListener('touchend', (event) => {
//         mousedown = false;
//         handwriting._endStroke();
//       });
//
//     canvas.addEventListener('mouseup', (event) => {
//       mousedown = false;
//       handwriting._endStroke();
//     });
//
//     return canvas;
//   }
//
//   const distance = (xs) => {
//     const diff = [xs[1][0] - xs[0][0], xs[1][1] - xs[0][1]];
//     return Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
//   }
//
//   const dottedLine = (width, x1, y1, x2, y2) => {
//     const result = new createjs.Shape();
//     result.graphics.setStrokeDash([width, width], 0);
//     result.graphics.setStrokeStyle(width)
//     result.graphics.beginStroke('#ccc');
//     result.graphics.moveTo(x1, y1);
//     result.graphics.lineTo(x2, y2);
//     return result;
//   }
//
//   const midpoint = (point1, point2) => {
//     return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
//   }
//
//   const pathToShape = (path, size, color, uncached) => {
//     const scale = 1024 / size;
//     const result = new createjs.Shape();
//     const tokens = path.split(' ');
//     let index = 0;
//     const next = () => {
//       index += 2;
//       let result = [tokens[index - 2], tokens[index - 1]];
//       result = result.map((x) => parseInt(x, 10));
//       result[1] = 900 - result[1];
//       return result.map((x) => Math.round(x / scale));
//     }
//     const arity = {C: 3, L: 1, M: 1, Q: 2, Z: 0};
//     while (index < tokens.length) {
//       index += 1;
//       const command = tokens[index - 1];
//       const args = _.range(arity[command] || 0).map(next);
//       if (command === 'Z') {
//         result.graphics.closePath();
//       } else if (command === 'M') {
//         result.graphics.beginFill(color);
//         result.graphics.beginStroke(color);
//         result.graphics.moveTo(args[0][0], args[0][1]);
//       } else if (command === 'L') {
//         result.graphics.lineTo(args[0][0], args[0][1]);
//       } else if (command === 'Q') {
//         result.graphics.curveTo(args[0][0], args[0][1], args[1][0], args[1][1]);
//       } else if (command === 'C') {
//         result.graphics.bezierCurveTo(
//           args[0][0], args[0][1],
//           args[1][0], args[1][1],
//           args[2][0], args[2][1],
//         );
//       } else {
//         console.error(`Invalid command: ${command}`);
//       }
//     }
//     if (!uncached) result.cache(0, 0, size, size);
//     return result;
//   }
//
//   const renderCross = (size, container) => {
//     const stroke = size * kCrossWidth;
//     container.addChild(dottedLine(stroke, 0, 0, size, size));
//     container.addChild(dottedLine(stroke, size, 0, 0, size));
//     container.addChild(dottedLine(stroke, size / 2, 0, size / 2, size));
//     container.addChild(dottedLine(stroke, 0, size/ 2, size, size / 2));
//     container.cache(0, 0, size, size);
//   }
//
//   // A helper brush class that allows us to draw nice ink facsimiles.
//   // 用于在画布上绘制基本的图形
//   class BasicBrush {
//     constructor(container, point, options) {
//       options = options || {};
//       this._color = options.color || kBrushColor;
//       this._width = options.width || 1;
//
//       this._shape = new createjs.Shape();
//       this._endpoint = point;
//       this._midpoint = null;
//       container.addChild(this._shape);
//     }
//     advance(point) {
//       const last_endpoint = this._endpoint;
//       const last_midpoint = this._midpoint;
//       this._endpoint = point;
//       this._midpoint = midpoint(last_endpoint, this._endpoint);
//       if (last_midpoint) {
//         this._draw(last_midpoint, this._midpoint, last_endpoint);
//       } else {
//         this._draw(last_endpoint, this._midpoint);
//       }
//     }
//     _draw(point1, point2, control) {
//         // console.log("_draw");
//       const graphics = this._shape.graphics;
//       graphics.setStrokeStyle(this._width, 'round');
//       graphics.beginStroke(this._color);
//       graphics.moveTo(point1[0], point1[1]);
//       if (control) {
//         graphics.curveTo(control[0], control[1], point2[0], point2[1]);
//       } else {
//         graphics.lineTo(point2[0], point2[1]);
//       }
//     }
//   }
//
//   // Methods for actually executing drawing commands.
//
//   const Layer = {
//     CROSS: 0,
//     CORNER: 1,
//     FADE: 2,
//     WATERMARK: 3,
//     HIGHLIGHT: 4,
//     COMPLETE: 5,
//     HINT: 6,
//     STROKE: 7,
//     WARNING: 8,
//     ALL: 9,
//   };
//
//   class Handwriting {
//     constructor(element, options) {
//       this._onclick = options.onclick;
//       this._ondouble = options.ondouble;
//       this._onstroke = options.onstroke;
//
//       this._settings = {};
//       ['double_tap_speed', 'reveal_order', 'snap_strokes'].forEach(
//           (x) => this._settings[x] = defaults[x]);
//
//       const canvas = createCanvas(element, this);
//       this._stage = new createjs.Stage(canvas);
//       this._size = this._stage.canvas.width;
//
//       this._layers = [];
//       for (let i = 0; i < Layer.ALL; i++) {
//         const layer = new createjs.Container();
//         this._layers.push(layer);
//         this._stage.addChild(layer);
//       }
//       renderCross(this._size, this._layers[Layer.CROSS]);
//
//       createjs.Ticker.timingMode = createjs.Ticker.RAF;
//       createjs.Ticker.removeEventListener('tick', ticker);
//       ticker = createjs.Ticker.addEventListener('tick', this._tick.bind(this));
//
//       this.clear();
//       console.log("in Handwriting");
//     }
//     clear(fade) {
//       createjs.Tween.removeAllTweens();
//       this._corner_characters = 0;
//       this._drawable = true;
//       this._emplacements = [];
//       this._pending_animations = 0;
//       this._running_animations = 0;
//       for (let layer of this._layers) {
//         if (fade) {
//           layer.children.forEach((x) => this._fade(x, 150));
//         } else {
//           layer.removeAllChildren();
//         }
//       }
//       console.log("in Handwriting clear");
//       this._reset();
//     }
//     emplace(args) {
//       if (this._settings.snap_strokes) {
//         this._emplace(args);
//       } else {
//         this._emplacements.push(args);
//       }
//     }
//     fade() {
//       const stroke = this._layers[Layer.STROKE];
//       this._fade(stroke.children[stroke.children.length - 1], 150);
//     }
//     flash(path) {
//       const child = pathToShape(path, this._size, kHintColor);
//       this._layers[Layer.HINT].addChild(child);
//       this._fade(child, 750);
//     }
//     glow(result) {
//       this._emplacements.forEach((args) => this._emplace(args));
//       this._emplacements = [];
//       const color = kResultColors[result] || kRevealColor;
//       for (let child of this._layers[Layer.COMPLETE].children) {
//         convertShapeStyles(child, color);
//       }
//       this.highlight();
//       this._drawable = false;
//     }
//     highlight(path) {
//       if (this._layers[Layer.WATERMARK].children.length === 0 ||
//           !this._settings.reveal_order) {
//         return;
//       }
//       const layer = this._layers[Layer.HIGHLIGHT];
//       for (let child of layer.children) {
//         this._fade(child, 150);
//       }
//       if (path) {
//         const child = pathToShape(path, this._size, kHintColor);
//         child.alpha = 0;
//         layer.addChild(child);
//         this._animate(child, {alpha: 1}, 150);
//       }
//     }
//     moveToCorner() {
//       const children = this._layers[Layer.COMPLETE].children.slice();
//       const container = new createjs.Container();
//       children.forEach((child) => container.addChild(child));
//       [Layer.WATERMARK, Layer.COMPLETE].forEach(
//           (layer) => this._layers[layer].removeAllChildren());
//       const endpoint = {scaleX: kCornerSize, scaleY: kCornerSize};
//       endpoint.x = kCornerSize * this._size * this._corner_characters;
//       this._layers[Layer.CORNER].addChild(container);
//       this._animate(container, endpoint, 150);
//       this._corner_characters += 1;
//       this._drawable = true;
//     }
//     reveal(paths) {
//       const layer = this._layers[Layer.WATERMARK];
//       if (layer.children.length > 0) return;
//       const container = new createjs.Container();
//       for (let path of paths) {
//         const child = pathToShape(
//             path, this._size, kRevealColor, true /* uncached */);
//         container.addChild(child);
//       }
//       container.cache(0, 0, this._size, this._size);
//       layer.addChild(container);
//     }
//     undo() {
//       this._layers[Layer.STROKE].children.pop();
//       this._reset();
//     }
//     warn(warning) {
//       const child = new createjs.Text(warning, '48px Georgia', kHintColor);
//       const bounds = child.getBounds();
//       child.x = (kCanvasSize - bounds.width) / 2;
//       child.y = kCanvasSize - 2 * bounds.height;
//       child.cache(0, 0, this._size, this._size);
//       this._layers[Layer.WARNING].removeAllChildren();
//       this._layers[Layer.WARNING].addChild(child);
//       this._fade(child, 1500);
//     }
//     _animate(shape, target, duration, callback) {
//       this._running_animations += 1;
//       createjs.Tween.get(shape).to(target, duration).call(() => {
//         this._pending_animations += 1;
//         callback && callback();
//       });
//     }
//     _click() {
//       const timestamp = new Date().getTime();
//       const double_tap_speed = this._settings.double_tap_speed;
//       const cutoff = (this._last_click_timestamp || 0) + double_tap_speed;
//       const handler = timestamp < cutoff ? this._ondouble : this._onclick;
//       this._last_click_timestamp = timestamp;
//       handler && handler();
//     }
//     _emplace(args) {
//       [path, rotate, source, target] = args;
//       const child = pathToShape(path, this._size, kStrokeColor);
//       const endpoint = animate(child, this._size, rotate, source, target);
//       this._layers[Layer.STROKE].children.pop();
//       this._layers[Layer.COMPLETE].addChild(child);
//       this._animate(child, endpoint, 150);
//     }
//     _drawStroke() {
//         // console.log("in Handwriting _drawStroke bg");
//       if (this._stroke.length < 2) {
//         return;
//       }
//       if (!this._settings.reveal_order) {
//         console.log('_drawStroke');
//         this._fadeWatermark();
//       }
//       const n = this._stroke.length;
//       // console.log("this._brush",this._brush);
//       if (!this._brush) {
//         // console.log("in Handwriting _drawStroke brush");
//         const layer = this._layers[Layer.STROKE];
//         const options = {width: this._size * kStrokeWidth};
//         this._brush = new BasicBrush(layer, this._stroke[n - 2], options);
//       }
//       this._brush.advance(this._stroke[n - 1]);
//       this._stage.update();
//     //   console.log("in Handwriting _drawStroke end");
//     }
//     _endStroke() {
//       let handler = () => this._click();
//       // console.log(this._stroke);
//       if (this._stroke.length >= 2) {
//         const layer = this._layers[Layer.STROKE];
//         const stroke = this._stroke.map((x) => x.map((y) => y / this._size));
//         const n = stroke.length;
//         // 此处做了修改,原函数不可使用
//         // if (_.any(stroke, (x) => distance([stroke[n - 1], x]) > kMinDistance)) {
//         if (stroke.some(x => distance([stroke[n - 1], x]) > kMinDistance)
//         ) {
//           layer.children.forEach((x) => x.cache(0, 0, this._size, this._size));
//           handler = () => this._onstroke && this._onstroke(stroke);
//         } else {
//           layer.removeAllChildren();
//         }
//       }
//       handler();
//       this._reset();
//     }
//     _fade(child, delay) {
//       this._animate(child, {alpha: 0}, delay,
//                     () => child.parent && child.parent.removeChild(child));
//     }
//     _fadeWatermark() {
//       const children = this._layers[Layer.WATERMARK].children;
//       if (children.length === 0) return;
//       const child = children.pop();
//       this._layers[Layer.FADE].addChild(child);
//       this._fade(child, 1500);
//     }
//     _pushPoint(point) {
//         // console.log(point[0],point[1]);
//       if (point[0] != null && point[1] != null) {
//         this._stroke.push(point);
//         if (this._drawable) this._drawStroke();
//       }
//     //   console.log("in Handwriting _pushPoint");
//     }
//     _reset() {
//       this._brush = null;
//       this._stroke = [];
//       this._stage.update();
//     //   console.log("in Handwriting reset");
//
//     }
//     _tick(event) {
//       if (this._running_animations) {
//         this._stage.update(event);
//         this._running_animations -= this._pending_animations;
//         this._pending_animations = 0;
//       }
//     }
//   }
//
//
//
// let element = null;
// let handwriting = null;
//
// const kMaxMistakes = 3;
// const kMaxPenalties  = 4;
//
// const item = {card: null, index: 0, tasks: []};
//
// const fixMedianCoordinates = (median) => median.map((x) => [x[0], 900 - x[1]]);
//
// const getResult = (x) => Math.min(Math.floor(2 * x / kMaxPenalties) + 1, 3);
//
// // const updateItem = (card, data) => {
// //     item.card = card;
// //     item.index = 0;
// //     item.tasks = data.characters.map((row, i) => ({
// //         data: row,
// //         index: i,
// //         matcher: new Matcher(row),
// //         missing: _.range(row.medians.length),
// //         mistakes: 0,
// //         penalties: 0,
// //         recording: [],
// //         result: null,
// //         strokes: row.strokes,
// //     }));
// // }
// var ini_task=null;
//
// async function initTask()
// {
//     uni="19981";
//     ch="不"
//     svgPath = './svgs-still/' + uni + '-still.svg';
//     console.log("initTask()")
//     await new Promise((resolve, reject) => {
//         try {
//             //离谱了，你这里还不能删掉这句看似多余的.then(response => response.text())，不然寄掉了
//             fetch(svgPath)
//                 .then(response => {
//                     if (!response.ok) {
//                         // throw new Error('Network response was not ok');
//                         //因为这个OCR还挺有意思，写个字母a,他真的给你返回unicode是97
//                         console.log('其实是字库里没有那个unicode，但对用户不能这样说', response)
//                         alert("您输入的是「" + ch + "」吗？恭喜您发现了系统的边界，请尝试输入其他汉字，我们的系统也将继续完善")
//                         // backWrite()
//                         // reject("在初始化svg的函数里被抛出")
//                         alert("其实是字库里没有那个unicode，但对用户不能这样说");
//                     }
//                     return response.text()
//                 })
//                 .then(data => {
//                     console.log("frtch success")
//                     var parser = new DOMParser();
//                     var svgDoc = parser.parseFromString(data, "image/svg+xml");
//
//                     // 获取所有的 <path> 元素
//                     var paths = svgDoc.querySelectorAll("path");
//
//                     // 本地测试受cos限制不能获取文件故如此模拟
//                     stks=["M 606 682 Q 630 694 746 694 Q 878 694 880 695 Q 88…4 Q 337 646 474 667 Q 504 673 560 677 L 606 682 Z",
//                         "M 560 677 Q 559 677 560 676 Q 561 649 550 612 Q 52…658 Q 624 674 606 682 C 580 697 561 707 560 677 Z",
//                         "M 504 528 Q 489 550 466 559 Q 454 560 450 553 Q 44…454 Q 540 472 539 483 C 539 486 523 505 504 528 Z",
//                         "M 632 397 Q 731 321 850 208 Q 868 189 884 184 Q 89…327 631 429 Q 621 435 620 421 Q 620 406 632 397 Z"]
//                     stks=[]
//                     paths.forEach(path => {
//                         stks.push(path.getAttribute("d"));
//                         // console.log(path.getAttribute("d")); // 输出 path 元素的 "d" 属性值，即路径数据
//                     });
//                     ini_task={
//         // data: row,
//         index: 0,
//         // matcher: new Matcher(row),
//         missing: Array.from(Array(paths.length).keys()),
//         mistakes: 0,
//         penalties: 0,
//         recording: [],
//         result: null,
//         strokes: stks,
//     }
//     item.tasks.push(ini_task);
//                     console.log(ini_task);
//
//                 })
//         }
//         catch (error) {
//             //因为这个OCR还挺有意思，写个字母a,他真的给你返回unicode是97
//             console.log('其实是字库里没有那个unicode，但对用户不能这样说', error)
//             alert("无法正确识别，还请您重新书写~")
//             // backWrite()
//         }
//
//     })
// }
//
// const onClick = () => {
//     console.log("onClick");
//     // if (maybeAdvance()) return;
//     // const task = item.tasks[item.index];
//     const task=ini_task;
//     // task.penalties += kMaxPenalties;
//     handwriting.flash(task.strokes[0]);
// }
//
// const onDouble = () => {
//     console.log("onDoubl");
//     // if (maybeAdvance()) return;
//     // const task = item.tasks[item.index];
//     // if (task.penalties < kMaxPenalties) return;
//     // handwriting.reveal(task.strokes);
//     // handwriting.highlight(task.strokes[task.missing[0]]);
// }
//
//
// const onStroke = (stroke) => {
//     console.log("onStroke");
//     // if (onRequestRegrade(stroke) || maybeAdvance()) return;
//     const task = item.tasks[item.index];
//     stroke = (new Shortstraw).run(stroke);
//     let best_result = {indices: [], score: -Infinity};
//     task.missing.forEach((candidate, i) => {
//         // if (!viable(candidate.indices, missing)) return;
//         // const first_index = _.min(candidate.indices);
//         // const offset = first_index - missing[0];
//         const offset =0;
//         const result = recognize(stroke,candidate , offset);
//         if (result.score > best_result.score) {
//             best_result = {
//                 // indices: candidate.indices,
//                 // penalties: result.penalties,
//                 score: result.score,
//                 source_segment: result.source,
//                 // simplified_median: candidate.median,
//                 // target_segment: result.target,
//                 // warning: result.warning,
//             };
//         }
//     });
//
//     // const result = task.matcher.match(stroke, task.missing);
//     // task.recording.push({indices: result.indices, stroke: stroke});
//
//     // The user's input does not match any of the character's strokes.
//     if (result.indices.length === 0) {
//         task.mistakes += 1;
//         handwriting.fade();
//         if (task.mistakes >= kMaxMistakes) {
//             task.penalties += kMaxPenalties;
//             handwriting.flash(task.strokes[task.missing[0]]);
//         }
//         return;
//     }
//
//     // Compute the matched path and the remaining missing strokes.
//     const path = result.indices.map((x) => task.strokes[x]).join(' ');
//     const missing = task.missing.filter((x) => result.indices.indexOf(x) < 0);
//
//     // The user's input matches strokes that were already drawn.
//     if (missing.length === task.missing.length) {
//         task.penalties += 1;
//         handwriting.undo();
//         handwriting.flash(path);
//         return;
//     }
//
//     // The user's input matches one or more of the missing strokes.
//     task.missing = missing;
//     const rotate = result.simplified_median.length === 2;
//     handwriting.emplace([path, rotate, result.source_segment,
//         result.target_segment]);
//     if (result.warning) {
//         task.penalties += result.penalties;
//         handwriting.warn(result.warning);
//     }
//
//     // If the user finished the character, mark it complete. Otherwise, if they
//     // drew a stroke out of order, penalize them and give them a hint.
//     const index = _.min(result.indices);
//     if (task.missing.length === 0) {
//         // helpers.set('complete', true);
//
//         //下面这句是完成字符绘制，触发相应事件，但是先注释
//         //$(window).trigger('makemeahanzi-character-complete');
//
//         task.result = getResult(task.penalties);
//         handwriting.glow(task.result);
//     } else if (task.missing[0] < index) {
//         task.penalties += 2 * (index - task.missing[0]);
//         handwriting.flash(task.strokes[task.missing[0]]);
//     } else {
//         task.mistakes = 0;
//         handwriting.highlight(task.strokes[task.missing[0]]);
//     }
// }
//
// const onRendered = function() {
//     const options = {onclick: onClick, ondouble: onDouble, onstroke: onStroke};
//     //   element = $(this.firstNode).find('.flashcard');
//     element=document.querySelector('#canvasArea');
//     // console.log(typeof element);
//
//     //element是canvas的父级元素
//     initTask();
//     console.log('new Handwriting(element, options)');
//     handwriting = new Handwriting(element, options);
// }



// const defaults = {
//     canvas_width: 88,
//     character_set: 'simplified',
//     double_tap_speed: 500,
//     max_adds: 20,
//     max_reviews: 200,
//     paper_filter: true,
//     reveal_order: true,
//     revisit_failures: true,
//     show_regrading_icon: true,
//     snap_strokes: true,
//   };
//
//   const screenWidth = window.innerWidth;
//
//   // const kCanvasSize = 512;
//   const kCanvasSize = screenWidth*0.4;
//
//   const kCornerSize = 1 / 8;
//   const kCrossWidth = 1 / 256;
//   const kMinDistance = 1 / 32;
//   const kStrokeWidth = 1 / 32;
//
//   const kBrushColor   = '#888888';
//   const kHintColor    = '#00c0ff';
//   const kRevealColor  = '#cccccc';
//   const kStrokeColor  = '#000000';
//
//   // Colors for EXCELLENT, GOOD, FAIR, and POOR result values.
//   const kResultColors = ['#84b4d8', '#88c874', '#c0c080', '#e87878'];
//
//
//
//   let ticker = null;
//
//   // Helper methods used by the handwriting class.
//
//   const angle = (xs) => Math.atan2(xs[1][1] - xs[0][1], xs[1][0] - xs[0][0]);
//
//
//   //这段代码定义了一个名为 animate 的函数，它接受五个参数：shape（形状对象）、size（大小）、rotate（是否旋转）、source（源点坐标）和 target（目标点坐标）。函数的作用是根据源点和目标点的位置来设置形状对象的属性，以实现动画效果。
//   const animate = (shape, size, rotate, source, target) => {
//     shape.regX = size * (target[0][0] + target[1][0]) / 2;
//     shape.regY = size * (target[0][1] + target[1][1]) / 2;
//     shape.x = size * (source[0][0] + source[1][0]) / 2;
//     shape.y = size * (source[0][1] + source[1][1]) / 2;
//     const scale = distance(source) / (distance(target) + kMinDistance);
//     shape.scaleX = scale;
//     shape.scaleY = scale;
//     if (rotate) {
//       const rotation = (180 / Math.PI) * (angle(source) - angle(target));
//       shape.rotation = ((Math.round(rotation) + 540) % 360) - 180;
//     }
//     return {rotation: 0, scaleX: 1, scaleY: 1, x: shape.regX, y: shape.regY};
//   }
//
//   const convertShapeStyles = (shape, end) => {
//     if (!shape.graphics || !shape.graphics.instructions) {
//       return;
//     }
//     let updated = false;
//     for (let instruction of shape.graphics.instructions) {
//       if (instruction.style) {
//         instruction.style = end;
//         updated = true;
//       }
//     }
//     if (updated) shape.updateCache();
//   }
//
//   const createCanvas = (element, handwriting) => {
//     const canvas = document.getElementById("practiceCanvas");
//
//     canvas.width = canvas.height = kCanvasSize;
//     //将canvas.style.width和canvas.style.height设置为和element相同
//     // canvas.style.width = canvas.style.height = `${element.width()}px`;
//     canvas.style.width = canvas.style.height = `${element.style.width}px`;
//     // console.log(typeof element);
//     // element.append(canvas);
//     // element.appendChild(canvas);
//
//     const touch_supported = 'ontouchstart' in window;
//     const zoom = kCanvasSize / element.style.width;
//
//     const getPosition = (event) => {
//       if (touch_supported) event = event.touches[0];
//       if (!event) return;
//       const bound = canvas.getBoundingClientRect();
//       const point = [event.clientX - bound.left, event.clientY - bound.top];
//       // console.log(point);
//       // console.log(kCanvasSize,element.style.width);
//     //   return point.map((x) => Math.round(zoom * x));
//       return point.map((x) => Math.round(x));
//     }
//
//     let mousedown = false;
//
//     // 摸出区域
//     canvas.ontouchcancel = function (e) {
//         mousedown = false;
//     }
//
//     // const start_event = touch_supported ? 'touchstart' : 'mousedown';
//     canvas.addEventListener('mousedown', (event) => {
//       mousedown = true;
//       if (event.cancelable) event.preventDefault();
//       handwriting._pushPoint(getPosition(event));
//     });
//
//     canvas.addEventListener('touchstart', (event) => {
//         mousedown = true;
//         if (event.cancelable) event.preventDefault();
//         handwriting._pushPoint(getPosition(event));
//       });
//
//
//
//     // const move_event = touch_supported ? 'touchmove' : 'mousemove';
//     canvas.addEventListener('touchmove', (event) => {
//       if (!mousedown) return;
//       handwriting._pushPoint(getPosition(event));
//     }, {passive: true});
//
//     canvas.addEventListener('mousemove', (event) => {
//         if (!mousedown) return;
//         handwriting._pushPoint(getPosition(event));
//       }, {passive: true});
//
//     // const end_event = touch_supported ? 'touchend' : 'mouseup';
//
//     canvas.addEventListener('touchend', (event) => {
//         mousedown = false;
//         handwriting._endStroke();
//       });
//
//     canvas.addEventListener('mouseup', (event) => {
//       mousedown = false;
//       handwriting._endStroke();
//     });
//
//     return canvas;
//   }
//
//   const distance = (xs) => {
//     const diff = [xs[1][0] - xs[0][0], xs[1][1] - xs[0][1]];
//     return Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
//   }
//
//   const dottedLine = (width, x1, y1, x2, y2) => {
//     const result = new createjs.Shape();
//     result.graphics.setStrokeDash([width, width], 0);
//     result.graphics.setStrokeStyle(width)
//     result.graphics.beginStroke('#ccc');
//     result.graphics.moveTo(x1, y1);
//     result.graphics.lineTo(x2, y2);
//     return result;
//   }
//
//   const midpoint = (point1, point2) => {
//     return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
//   }
//
//   const pathToShape = (path, size, color, uncached) => {
//     const scale = 1024 / size;
//     const result = new createjs.Shape();
//     const tokens = path.split(' ');
//     let index = 0;
//     const next = () => {
//       index += 2;
//       let result = [tokens[index - 2], tokens[index - 1]];
//       result = result.map((x) => parseInt(x, 10));
//       result[1] = 900 - result[1];
//       return result.map((x) => Math.round(x / scale));
//     }
//     const arity = {C: 3, L: 1, M: 1, Q: 2, Z: 0};
//     while (index < tokens.length) {
//       index += 1;
//       const command = tokens[index - 1];
//       const args = _.range(arity[command] || 0).map(next);
//       if (command === 'Z') {
//         result.graphics.closePath();
//       } else if (command === 'M') {
//         result.graphics.beginFill(color);
//         result.graphics.beginStroke(color);
//         result.graphics.moveTo(args[0][0], args[0][1]);
//       } else if (command === 'L') {
//         result.graphics.lineTo(args[0][0], args[0][1]);
//       } else if (command === 'Q') {
//         result.graphics.curveTo(args[0][0], args[0][1], args[1][0], args[1][1]);
//       } else if (command === 'C') {
//         result.graphics.bezierCurveTo(
//           args[0][0], args[0][1],
//           args[1][0], args[1][1],
//           args[2][0], args[2][1],
//         );
//       } else {
//         console.error(`Invalid command: ${command}`);
//       }
//     }
//     if (!uncached) result.cache(0, 0, size, size);
//     return result;
//   }
//
//   const renderCross = (size, container) => {
//     const stroke = size * kCrossWidth;
//     container.addChild(dottedLine(stroke, 0, 0, size, size));
//     container.addChild(dottedLine(stroke, size, 0, 0, size));
//     container.addChild(dottedLine(stroke, size / 2, 0, size / 2, size));
//     container.addChild(dottedLine(stroke, 0, size/ 2, size, size / 2));
//     container.cache(0, 0, size, size);
//   }
//
//   // A helper brush class that allows us to draw nice ink facsimiles.
//   // 用于在画布上绘制基本的图形
//   class BasicBrush {
//     constructor(container, point, options) {
//       options = options || {};
//       this._color = options.color || kBrushColor;
//       this._width = options.width || 1;
//
//       this._shape = new createjs.Shape();
//       this._endpoint = point;
//       this._midpoint = null;
//       container.addChild(this._shape);
//     }
//     advance(point) {
//       const last_endpoint = this._endpoint;
//       const last_midpoint = this._midpoint;
//       this._endpoint = point;
//       this._midpoint = midpoint(last_endpoint, this._endpoint);
//       if (last_midpoint) {
//         this._draw(last_midpoint, this._midpoint, last_endpoint);
//       } else {
//         this._draw(last_endpoint, this._midpoint);
//       }
//     }
//     _draw(point1, point2, control) {
//         // console.log("_draw");
//       const graphics = this._shape.graphics;
//       graphics.setStrokeStyle(this._width, 'round');
//       graphics.beginStroke(this._color);
//       graphics.moveTo(point1[0], point1[1]);
//       if (control) {
//         graphics.curveTo(control[0], control[1], point2[0], point2[1]);
//       } else {
//         graphics.lineTo(point2[0], point2[1]);
//       }
//     }
//   }
//
//   // Methods for actually executing drawing commands.
//
//   const Layer = {
//     CROSS: 0,
//     CORNER: 1,
//     FADE: 2,
//     WATERMARK: 3,
//     HIGHLIGHT: 4,
//     COMPLETE: 5,
//     HINT: 6,
//     STROKE: 7,
//     WARNING: 8,
//     ALL: 9,
//   };
//
//   class Handwriting {
//     constructor(element, options) {
//       this._onclick = options.onclick;
//       this._ondouble = options.ondouble;
//       this._onstroke = options.onstroke;
//
//       this._settings = {};
//       ['double_tap_speed', 'reveal_order', 'snap_strokes'].forEach(
//           (x) => this._settings[x] = defaults[x]);
//
//       const canvas = createCanvas(element, this);
//       this._stage = new createjs.Stage(canvas);
//       this._size = this._stage.canvas.width;
//
//       this._layers = [];
//       for (let i = 0; i < Layer.ALL; i++) {
//         const layer = new createjs.Container();
//         this._layers.push(layer);
//         this._stage.addChild(layer);
//       }
//       renderCross(this._size, this._layers[Layer.CROSS]);
//
//       createjs.Ticker.timingMode = createjs.Ticker.RAF;
//       createjs.Ticker.removeEventListener('tick', ticker);
//       ticker = createjs.Ticker.addEventListener('tick', this._tick.bind(this));
//
//       this.clear();
//       console.log("in Handwriting");
//     }
//     clear(fade) {
//       createjs.Tween.removeAllTweens();
//       this._corner_characters = 0;
//       this._drawable = true;
//       this._emplacements = [];
//       this._pending_animations = 0;
//       this._running_animations = 0;
//       for (let layer of this._layers) {
//         if (fade) {
//           layer.children.forEach((x) => this._fade(x, 150));
//         } else {
//           layer.removeAllChildren();
//         }
//       }
//       console.log("in Handwriting clear");
//       this._reset();
//     }
//     emplace(args) {
//       if (this._settings.snap_strokes) {
//         this._emplace(args);
//       } else {
//         this._emplacements.push(args);
//       }
//     }
//     fade() {
//       const stroke = this._layers[Layer.STROKE];
//       this._fade(stroke.children[stroke.children.length - 1], 150);
//     }
//     flash(path) {
//       const child = pathToShape(path, this._size, kHintColor);
//       this._layers[Layer.HINT].addChild(child);
//       this._fade(child, 750);
//     }
//     glow(result) {
//       this._emplacements.forEach((args) => this._emplace(args));
//       this._emplacements = [];
//       const color = kResultColors[result] || kRevealColor;
//       for (let child of this._layers[Layer.COMPLETE].children) {
//         convertShapeStyles(child, color);
//       }
//       this.highlight();
//       this._drawable = false;
//     }
//     highlight(path) {
//       if (this._layers[Layer.WATERMARK].children.length === 0 ||
//           !this._settings.reveal_order) {
//         return;
//       }
//       const layer = this._layers[Layer.HIGHLIGHT];
//       for (let child of layer.children) {
//         this._fade(child, 150);
//       }
//       if (path) {
//         const child = pathToShape(path, this._size, kHintColor);
//         child.alpha = 0;
//         layer.addChild(child);
//         this._animate(child, {alpha: 1}, 150);
//       }
//     }
//     moveToCorner() {
//       const children = this._layers[Layer.COMPLETE].children.slice();
//       const container = new createjs.Container();
//       children.forEach((child) => container.addChild(child));
//       [Layer.WATERMARK, Layer.COMPLETE].forEach(
//           (layer) => this._layers[layer].removeAllChildren());
//       const endpoint = {scaleX: kCornerSize, scaleY: kCornerSize};
//       endpoint.x = kCornerSize * this._size * this._corner_characters;
//       this._layers[Layer.CORNER].addChild(container);
//       this._animate(container, endpoint, 150);
//       this._corner_characters += 1;
//       this._drawable = true;
//     }
//     reveal(paths) {
//       const layer = this._layers[Layer.WATERMARK];
//       if (layer.children.length > 0) return;
//       const container = new createjs.Container();
//       for (let path of paths) {
//         const child = pathToShape(
//             path, this._size, kRevealColor, true /* uncached */);
//         container.addChild(child);
//       }
//       container.cache(0, 0, this._size, this._size);
//       layer.addChild(container);
//     }
//     undo() {
//       this._layers[Layer.STROKE].children.pop();
//       this._reset();
//     }
//     warn(warning) {
//       const child = new createjs.Text(warning, '48px Georgia', kHintColor);
//       const bounds = child.getBounds();
//       child.x = (kCanvasSize - bounds.width) / 2;
//       child.y = kCanvasSize - 2 * bounds.height;
//       child.cache(0, 0, this._size, this._size);
//       this._layers[Layer.WARNING].removeAllChildren();
//       this._layers[Layer.WARNING].addChild(child);
//       this._fade(child, 1500);
//     }
//     _animate(shape, target, duration, callback) {
//       this._running_animations += 1;
//       createjs.Tween.get(shape).to(target, duration).call(() => {
//         this._pending_animations += 1;
//         callback && callback();
//       });
//     }
//     _click() {
//       const timestamp = new Date().getTime();
//       const double_tap_speed = this._settings.double_tap_speed;
//       const cutoff = (this._last_click_timestamp || 0) + double_tap_speed;
//       const handler = timestamp < cutoff ? this._ondouble : this._onclick;
//       this._last_click_timestamp = timestamp;
//       handler && handler();
//     }
//     _emplace(args) {
//       [path, rotate, source, target] = args;
//       const child = pathToShape(path, this._size, kStrokeColor);
//       const endpoint = animate(child, this._size, rotate, source, target);
//       this._layers[Layer.STROKE].children.pop();
//       this._layers[Layer.COMPLETE].addChild(child);
//       this._animate(child, endpoint, 150);
//     }
//     _drawStroke() {
//         // console.log("in Handwriting _drawStroke bg");
//       if (this._stroke.length < 2) {
//         return;
//       }
//       if (!this._settings.reveal_order) {
//         console.log('_drawStroke');
//         this._fadeWatermark();
//       }
//       const n = this._stroke.length;
//       // console.log("this._brush",this._brush);
//       if (!this._brush) {
//         // console.log("in Handwriting _drawStroke brush");
//         const layer = this._layers[Layer.STROKE];
//         const options = {width: this._size * kStrokeWidth};
//         this._brush = new BasicBrush(layer, this._stroke[n - 2], options);
//       }
//       this._brush.advance(this._stroke[n - 1]);
//       this._stage.update();
//     //   console.log("in Handwriting _drawStroke end");
//     }
//     _endStroke() {
//       let handler = () => this._click();
//       // console.log(this._stroke);
//       if (this._stroke.length >= 2) {
//         const layer = this._layers[Layer.STROKE];
//         const stroke = this._stroke.map((x) => x.map((y) => y / this._size));
//         const n = stroke.length;
//         // 此处做了修改,原函数不可使用
//         // if (_.any(stroke, (x) => distance([stroke[n - 1], x]) > kMinDistance)) {
//         if (stroke.some(x => distance([stroke[n - 1], x]) > kMinDistance)
//         ) {
//           layer.children.forEach((x) => x.cache(0, 0, this._size, this._size));
//           handler = () => this._onstroke && this._onstroke(stroke);
//         } else {
//           layer.removeAllChildren();
//         }
//       }
//       handler();
//       this._reset();
//     }
//     _fade(child, delay) {
//       this._animate(child, {alpha: 0}, delay,
//                     () => child.parent && child.parent.removeChild(child));
//     }
//     _fadeWatermark() {
//       const children = this._layers[Layer.WATERMARK].children;
//       if (children.length === 0) return;
//       const child = children.pop();
//       this._layers[Layer.FADE].addChild(child);
//       this._fade(child, 1500);
//     }
//     _pushPoint(point) {
//         // console.log(point[0],point[1]);
//       if (point[0] != null && point[1] != null) {
//         this._stroke.push(point);
//         if (this._drawable) this._drawStroke();
//       }
//     //   console.log("in Handwriting _pushPoint");
//     }
//     _reset() {
//       this._brush = null;
//       this._stroke = [];
//       this._stage.update();
//     //   console.log("in Handwriting reset");
//
//     }
//     _tick(event) {
//       if (this._running_animations) {
//         this._stage.update(event);
//         this._running_animations -= this._pending_animations;
//         this._pending_animations = 0;
//       }
//     }
//   }


/*                    handwriting                       */

const defaults = {
  // canvas_width: 88,
  character_set: 'simplified',
  double_tap_speed: 500,
  max_adds: 20,
  max_reviews: 200,
  paper_filter: true,
  reveal_order: true,
  revisit_failures: true,
  show_regrading_icon: true,
  snap_strokes: true,
};

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

// const kCanvasSize = 512;
var kCanvasSize = screenWidth*0.4<screenHeight*0.6 ? screenWidth*0.4:screenHeight*0.6;

const kCornerSize = 1 / 8;
const kCrossWidth = 1 / 256;
// 此变量已经在all-matcher中声明
// const kMinDistance = 1 / 32;
const kStrokeWidth = 1 / 32;

const kBrushColor   = '#888888';
// const kHintColor    = '#00c0ff';
const kHintColor    = '#f47983';
const kRevealColor  = '#cccccc';
const kStrokeColor  = '#000000';

// Colors for EXCELLENT, GOOD, FAIR, and POOR result values.
// const kResultColors = ['#84b4d8', '#88c874', '#c0c080', '#e87878'];
const kResultColors = ['#84b4d8', '#88c874', '#88c874', '#88c874'];



var ticker = null;



// Helper methods used by the handwriting class.

const angle = (xs) => Math.atan2(xs[1][1] - xs[0][1], xs[1][0] - xs[0][0]);


//这段代码定义了一个名为 animate 的函数，它接受五个参数：shape（形状对象）、size（大小）、rotate（是否旋转）、source（源点坐标）和 target（目标点坐标）。函数的作用是根据源点和目标点的位置来设置形状对象的属性，以实现动画效果。
const animate = (shape, size, rotate, source, target) => {
  shape.regX = size * (target[0][0] + target[1][0]) / 2;
  shape.regY = size * (target[0][1] + target[1][1]) / 2;
  shape.x = size * (source[0][0] + source[1][0]) / 2;
  shape.y = size * (source[0][1] + source[1][1]) / 2;
  const scale = cal_distance(source) / (cal_distance(target) + kMinDistance);
  shape.scaleX = scale;
  shape.scaleY = scale;
  if (rotate) {
    const rotation = (180 / Math.PI) * (angle(source) - angle(target));
    shape.rotation = ((Math.round(rotation) + 540) % 360) - 180;
  }
  return {rotation: 0, scaleX: 1, scaleY: 1, x: shape.regX, y: shape.regY};
}

const convertShapeStyles = (shape, end) => {
  if (!shape.graphics || !shape.graphics.instructions) {
    return;
  }
  let updated = false;
  for (let instruction of shape.graphics.instructions) {
    if (instruction.style) {
      instruction.style = end;
      updated = true;
    }
  }
  if (updated) shape.updateCache();
}

const createCanvas = (element, handwriting) => {
  const canvas = document.getElementById("practiceCanvas");

  canvas.width = canvas.height = kCanvasSize;
  //将canvas.style.width和canvas.style.height设置为和element相同
  // canvas.style.width = canvas.style.height = `${element.width()}px`;
  canvas.style.width = canvas.style.height = `${element.style.width}px`;
  // console.log(typeof element);
  // element.append(canvas);
  // element.appendChild(canvas);

  const touch_supported = 'ontouchstart' in window;
  const zoom = kCanvasSize / element.style.width;

  const getPosition = (event) => {
    if (touch_supported) event = event.touches[0];
    if (!event) return;
    const bound = canvas.getBoundingClientRect();
    const point = [event.clientX - bound.left, event.clientY - bound.top];
    // console.log(point);
    // console.log(kCanvasSize,element.style.width);
    //   return point.map((x) => Math.round(zoom * x));
    return point.map((x) => Math.round(x));
  }

  let mousedown = false;

  // 摸出区域
  canvas.ontouchcancel = function (e) {
    mousedown = false;
  }

  // const start_event = touch_supported ? 'touchstart' : 'mousedown';
  canvas.addEventListener('mousedown', (event) => {
    mousedown = true;
    if (event.cancelable) event.preventDefault();
    handwriting._pushPoint(getPosition(event));
  });

  canvas.addEventListener('touchstart', (event) => {
    mousedown = true;
    if (event.cancelable) event.preventDefault();
    handwriting._pushPoint(getPosition(event));
  });



  // const move_event = touch_supported ? 'touchmove' : 'mousemove';
  canvas.addEventListener('touchmove', (event) => {
    if (!mousedown) return;
    handwriting._pushPoint(getPosition(event));
  }, {passive: true});

  canvas.addEventListener('mousemove', (event) => {
    if (!mousedown) return;
    handwriting._pushPoint(getPosition(event));
  }, {passive: true});

  // const end_event = touch_supported ? 'touchend' : 'mouseup';

  canvas.addEventListener('touchend', (event) => {
    mousedown = false;
    handwriting._endStroke();
  });

  canvas.addEventListener('mouseup', (event) => {
    // console.log('mouseup');
    mousedown = false;
    handwriting._endStroke();
  });

  return canvas;
}

const cal_distance = (xs) => {
  const diff = [xs[1][0] - xs[0][0], xs[1][1] - xs[0][1]];
  return Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
}

const rectFilled=(x1, y1, x2, y2)=>{
  const result = new createjs.Shape();
  // result.graphics.beginStroke("#982f13");
  result.graphics.beginFill("rgba(255, 255, 255, 0.3)"); // 白色
  result.graphics.drawRect(x1, y1, x2, y2);
  result.graphics.endFill();
  return result;
}

const rectTrans=(width,x1, y1, x2, y2)=>{
  const result = new createjs.Shape();
  result.graphics.setStrokeStyle(width*5);
  result.graphics.beginStroke("#982f13");
  result.graphics.beginFill("rgba(255, 255, 255, 0.0)"); // 白色
  result.graphics.drawRect(x1, y1, x2, y2);
  result.graphics.endFill();
  return result;
}

const dottedLine = (width, x1, y1, x2, y2) => {
  const result = new createjs.Shape();
  result.graphics.setStrokeDash([width, width], 0);
  result.graphics.setStrokeStyle(width)
  result.graphics.beginStroke('#ccc');
  result.graphics.moveTo(x1, y1);
  result.graphics.lineTo(x2, y2);
  return result;
}

const midpoint = (point1, point2) => {
  return [(point1[0] + point2[0]) / 2, (point1[1] + point2[1]) / 2];
}

const pathToShape = (path, size, color, uncached) => {
  const scale = 1024 / size;
  const result = new createjs.Shape();
  const tokens = path.split(' ');
  let index = 0;
  const next = () => {
    index += 2;
    let result = [tokens[index - 2], tokens[index - 1]];
    result = result.map((x) => parseInt(x, 10));
    result[1] = 900 - result[1];
    return result.map((x) => Math.round(x / scale));
  }
  const arity = {C: 3, L: 1, M: 1, Q: 2, Z: 0};
  while (index < tokens.length) {
    index += 1;
    const command = tokens[index - 1];
    const args = _.range(arity[command] || 0).map(next);
    if (command === 'Z') {
      result.graphics.closePath();
    } else if (command === 'M') {
      result.graphics.beginFill(color);
      result.graphics.beginStroke(color);
      result.graphics.moveTo(args[0][0], args[0][1]);
    } else if (command === 'L') {
      result.graphics.lineTo(args[0][0], args[0][1]);
    } else if (command === 'Q') {
      result.graphics.curveTo(args[0][0], args[0][1], args[1][0], args[1][1]);
    } else if (command === 'C') {
      result.graphics.bezierCurveTo(
          args[0][0], args[0][1],
          args[1][0], args[1][1],
          args[2][0], args[2][1],
      );
    } else {
      console.error(`Invalid command: ${command}`);
    }
  }
  if (!uncached) result.cache(0, 0, size, size);
  return result;
}

const renderCross = (size, container) => {
  const stroke = size * kCrossWidth;
  container.addChild(rectFilled(0, 0, size, size));
  container.addChild(dottedLine(stroke, 0, 0, size, size));
  container.addChild(dottedLine(stroke, size, 0, 0, size));
  container.addChild(dottedLine(stroke, size / 2, 0, size / 2, size));
  container.addChild(dottedLine(stroke, 0, size/ 2, size, size / 2));
  container.addChild(rectTrans(stroke,0, 0, size, size));
  container.cache(0, 0, size, size);
}

// A helper brush class that allows us to draw nice ink facsimiles.
// 用于在画布上绘制基本的图形
class BasicBrush {
  constructor(container, point, options) {
    options = options || {};
    this._color = options.color || kBrushColor;
    this._width = options.width || 1;

    this._shape = new createjs.Shape();
    this._endpoint = point;
    this._midpoint = null;
    container.addChild(this._shape);
  }
  advance(point) {
    const last_endpoint = this._endpoint;
    const last_midpoint = this._midpoint;
    this._endpoint = point;
    this._midpoint = midpoint(last_endpoint, this._endpoint);
    if (last_midpoint) {
      this._draw(last_midpoint, this._midpoint, last_endpoint);
    } else {
      this._draw(last_endpoint, this._midpoint);
    }
  }
  _draw(point1, point2, control) {
    // console.log("_draw");
    const graphics = this._shape.graphics;
    graphics.setStrokeStyle(this._width, 'round');
    graphics.beginStroke(this._color);
    graphics.moveTo(point1[0], point1[1]);
    if (control) {
      graphics.curveTo(control[0], control[1], point2[0], point2[1]);
    } else {
      graphics.lineTo(point2[0], point2[1]);
    }
  }
}

// Methods for actually executing drawing commands.

const Layer = {
  CROSS: 0,
  CORNER: 1,
  FADE: 2,
  WATERMARK: 3,
  HIGHLIGHT: 4,
  COMPLETE: 5,
  HINT: 6,
  STROKE: 7,
  WARNING: 8,
  ALL: 9,
};

class Handwriting {
  constructor(element, options) {
    this._onclick = options.onclick;
    this._ondouble = options.ondouble;
    this._onstroke = options.onstroke;

    this._settings = {};
    ['double_tap_speed', 'reveal_order', 'snap_strokes'].forEach(
        (x) => this._settings[x] = defaults[x]);

    const canvas = createCanvas(element, this);
    this._stage = new createjs.Stage(canvas);
    this._size = this._stage.canvas.width;

    this._layers = [];
    for (let i = 0; i < Layer.ALL; i++) {
      const layer = new createjs.Container();
      this._layers.push(layer);
      this._stage.addChild(layer);
    }
    renderCross(this._size, this._layers[Layer.CROSS]);

    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.removeEventListener('tick', ticker);
    ticker = createjs.Ticker.addEventListener('tick', this._tick.bind(this));

    this.clear();
    console.log("in Handwriting");
  }
  clear(fade) {
    createjs.Tween.removeAllTweens();
    this._corner_characters = 0;
    this._drawable = true;
    this._emplacements = [];
    this._pending_animations = 0;
    this._running_animations = 0;
    for (let layer of this._layers) {
      if (fade) {
        layer.children.forEach((x) => this._fade(x, 150));
      } else {
        layer.removeAllChildren();
      }
    }
    console.log("in Handwriting clear");
    this._reset();
  }
  emplace(args) {
    if (this._settings.snap_strokes) {
      this._emplace(args);
    } else {
      this._emplacements.push(args);
    }
  }
  fade() {
    const stroke = this._layers[Layer.STROKE];
    this._fade(stroke.children[stroke.children.length - 1], 150);
  }
  flash(path) {
    const child = pathToShape(path, this._size, kHintColor);
    this._layers[Layer.HINT].addChild(child);
    this._fade(child, 750);
  }
  glow(result) {
    this._emplacements.forEach((args) => this._emplace(args));
    this._emplacements = [];
    const color = kResultColors[result] || kRevealColor;
    for (let child of this._layers[Layer.COMPLETE].children) {
      convertShapeStyles(child, color);
    }
    this.highlight();
    this._drawable = false;
  }
  highlight(path) {
    if (this._layers[Layer.WATERMARK].children.length === 0 ||
        !this._settings.reveal_order) {
      return;
    }
    const layer = this._layers[Layer.HIGHLIGHT];
    for (let child of layer.children) {
      this._fade(child, 150);
    }
    if (path) {
      const child = pathToShape(path, this._size, kHintColor);
      child.alpha = 0;
      layer.addChild(child);
      this._animate(child, {alpha: 1}, 150);
    }
  }
  clearStage(){
    const children = this._layers[Layer.COMPLETE].children.slice();
    const container = new createjs.Container();
    children.forEach((child) => container.addChild(child));
    [Layer.WATERMARK, Layer.COMPLETE].forEach(
        (layer) => this._layers[layer].removeAllChildren());

    this._drawable = true;
  }

  moveToCorner() {
    const children = this._layers[Layer.COMPLETE].children.slice();
    const container = new createjs.Container();
    children.forEach((child) => container.addChild(child));
    [Layer.WATERMARK, Layer.COMPLETE].forEach(
        (layer) => this._layers[layer].removeAllChildren());
    const endpoint = {scaleX: kCornerSize, scaleY: kCornerSize};
    endpoint.x = kCornerSize * this._size * this._corner_characters;
    this._layers[Layer.CORNER].addChild(container);
    this._animate(container, endpoint, 150);
    this._corner_characters += 1;
    this._drawable = true;
  }
  reveal(paths) {
    const layer = this._layers[Layer.WATERMARK];
    if (layer.children.length > 0) return;
    const container = new createjs.Container();
    for (let path of paths) {
      const child = pathToShape(
          path, this._size, kRevealColor, true /* uncached */);
      container.addChild(child);
    }
    container.cache(0, 0, this._size, this._size);
    layer.addChild(container);
  }
  undo() {
    this._layers[Layer.STROKE].children.pop();
    this._reset();
  }
  warn(warning) {
    const child = new createjs.Text(warning, '48px Georgia', kHintColor);
    const bounds = child.getBounds();
    child.x = (kCanvasSize - bounds.width) / 2;
    child.y = kCanvasSize - 2 * bounds.height;
    child.cache(0, 0, this._size, this._size);
    this._layers[Layer.WARNING].removeAllChildren();
    this._layers[Layer.WARNING].addChild(child);
    this._fade(child, 1500);
  }
  _animate(shape, target, duration, callback) {
    this._running_animations += 1;
    createjs.Tween.get(shape).to(target, duration).call(() => {
      this._pending_animations += 1;
      callback && callback();
    });
  }
  
  _click() {
    const timestamp = new Date().getTime();
    const double_tap_speed = this._settings.double_tap_speed;
    const cutoff = (this._last_click_timestamp || 0) + double_tap_speed;
    const handler = timestamp < cutoff ? this._ondouble : this._onclick;
    this._last_click_timestamp = timestamp;
    handler && handler();
  }
  _emplace(args) {
    // console.log(typeof args[0]);
    var path=args[0];
    var rotate=args[1];
    var source=args[2];
    var target=args[3];
    // [path, rotate, source, target] = args;
    const child = pathToShape(path, this._size, kStrokeColor);
    const endpoint = animate(child, this._size, rotate, source, target);
    this._layers[Layer.STROKE].children.pop();
    this._layers[Layer.COMPLETE].addChild(child);
    this._animate(child, endpoint, 150);
  }
  _drawStroke() {
    // console.log("in Handwriting _drawStroke bg");
    if (this._stroke.length < 2) {
      return;
    }
    if (!this._settings.reveal_order) {
      console.log('_drawStroke');
      this._fadeWatermark();
    }
    const n = this._stroke.length;
    // console.log("this._brush",this._brush);
    if (!this._brush) {
      // console.log("in Handwriting _drawStroke brush");
      const layer = this._layers[Layer.STROKE];
      const options = {width: this._size * kStrokeWidth};
      this._brush = new BasicBrush(layer, this._stroke[n - 2], options);
    }
    this._brush.advance(this._stroke[n - 1]);
    this._stage.update();
    //   console.log("in Handwriting _drawStroke end");
  }
  _endStroke() {
    let handler = () => this._click();
    // console.log(this._stroke);
    if (this._stroke.length >= 2) {
      const layer = this._layers[Layer.STROKE];
      const stroke = this._stroke.map((x) => x.map((y) => y / this._size));
      const n = stroke.length;
      // 此处做了修改,原函数不可使用
      // if (_.any(stroke, (x) => distance([stroke[n - 1], x]) > kMinDistance)) {
      if (stroke.some(x => cal_distance([stroke[n - 1], x]) > kMinDistance)
      ) {
        layer.children.forEach((x) => x.cache(0, 0, this._size, this._size));
        handler = () => this._onstroke && this._onstroke(stroke);
      } else {
        layer.removeAllChildren();
      }
    }
    handler();
    this._reset();
  }
  _fade(child, delay) {
    this._animate(child, {alpha: 0}, delay,
        () => child.parent && child.parent.removeChild(child));
  }
  _fadeWatermark() {
    const children = this._layers[Layer.WATERMARK].children;
    if (children.length === 0) return;
    const child = children.pop();
    this._layers[Layer.FADE].addChild(child);
    this._fade(child, 1500);
  }
  _pushPoint(point) {
    // console.log(point[0],point[1]);
    if (point[0] != null && point[1] != null) {
      this._stroke.push(point);
      if (this._drawable) this._drawStroke();
    }
    //   console.log("in Handwriting _pushPoint");
  }
  _reset() {
    this._brush = null;
    this._stroke = [];
    this._stage.update();
    //   console.log("in Handwriting reset");

  }
  _tick(event) {
    if (this._running_animations) {
      this._stage.update(event);
      this._running_animations -= this._pending_animations;
      this._pending_animations = 0;
    }
  }
}



var element = null;
var handwriting = null;

const kMaxMistakes = 3;
const kMaxPenalties  = 4;

var item = {index: 0,taskList:[] ,tasks: []};

var practicelists={index:0,lists:[]};
// var taskList=[];

// 已经在all-matcher中定义
// const fixMedianCoordinates = (median) => median.map((x) => [x[0], 900 - x[1]]);

const getResult = (x) => Math.min(Math.floor(2 * x / kMaxPenalties) + 1, 3);

const viable = (indices, missing) => {
  if (indices.length === 1) return true;
  const set = {};
  missing.forEach((x) => set[x] = true);
  const remaining = indices.filter((x) => set[x]).length;
  return remaining === 0 || remaining === indices.length;
}

var ini_task=null;

const updataDescription=()=>{
  const task= item.tasks[item.index];
  const pinyin=task.data.pinyin;
  const definition=task.data.definition;
  // const radical=task.data.radical;

  var pinyinP=document.getElementById("pinyin");
  var definitionP=document.getElementById("definition");

  var show_pinyinP=document.getElementById("show_pinyin");
  var show_definitionP=document.getElementById("show_definition");
  var show_radicalP=document.getElementById("show_radical");
  var show_decompositionP=document.getElementById("show_decomposition");
  var show_hintP=document.getElementById("show_hint");



  console.log("pinyin",pinyin);
  // console.log("typeof pinyin",typeof pinyin);
  if(definition && definition.length>0)
    console.log("definition",definition);
  if(task.data.decomposition && task.data.decomposition.length>0 && task.data.decomposition!=="？")
    console.log("task.data.decomposition",task.data.decomposition);
  if(task.data.etymology && task.data.etymology['hint'].length>0)
    console.log("task.data.etymology",task.data.etymology);
  if(task.data.radical && task.data.radical.length>0)
    console.log("task.data.radical",task.data.radical);

  if(pinyin) {
    pinyinP.textContent = pinyin;
    // show_pinyinP.textContent="pinyin: "+pinyin;
    show_pinyinP.textContent="拼音: "+pinyin;
  }
  else {
    pinyinP.textContent = "";
    show_pinyinP.textContent = "";
  }

  if(definition && definition.length>0) {
    definitionP.textContent = definition;
    // show_definitionP.textContent = "definition: "+definition;
    show_definitionP.textContent = "英文含义: "+definition;
  }
  else {
    definitionP.textContent = "";
    show_definitionP.textContent = "";
  }

  if(task.data.radical && task.data.radical.length>0){
    // show_radicalP.textContent ="radical: "+task.data.radical ;
    show_radicalP.textContent ="偏旁部首: "+task.data.radical ;
  }
  else{
    show_radicalP.textContent ="";
  }

  if(task.data.decomposition && task.data.decomposition.length>0 && task.data.decomposition!=="？"){
    // show_decompositionP.textContent ="decomposition: "+task.data.decomposition ;
    show_decompositionP.textContent ="构字组件: "+task.data.decomposition ;
  }
  else{
    show_decompositionP.textContent ="";
  }

  show_hintP.textContent =""
  // if(task.data.etymology && task.data.etymology['hint'].length>0){
  //   show_hintP.textContent ="hint: "+task.data.etymology['hint'];
  // }
  // else{
  //   show_hintP.textContent ="";
  // }

  // if()
  var dropdownContent = document.getElementById("dropdownContent");
  dropdownContent.style.display = "none";




}

//transition();和maybeRecordResult();可能用不到

const maybeAdvance = () => {
  console.log("in maybeAdvance");
  if (item.index === item.tasks.length) {
    console.log("item.index === item.tasks.length");
    return true;
  }

  const task = item.tasks[item.index];
  if (task.missing.length > 0) {
    console.log("task.missing.length > 0");
    return false;
  } else if (task.result === null) {
    console.log("task.result === null");
    return true;
  }
  item.index += 1;

  // helpers.set('complete', false);

  // 下面这个函数是要执行下一个汉字的练习，需要替换成自己的方法
  // $(window).trigger('makemeahanzi-next-character');

  if (item.index < item.tasks.length) {
    console.log("item.index < item.tasks.length");
    updataDescription();
    handwriting.clearStage();
    // handwriting.moveToCorner();
  } else {
    console.log("else");
    // transition();
    // maybeRecordResult();


    handwriting.clear();
    initTask("83");
  }
  return true;
}

const onRequestRegrade = (stroke) => {
  const task = item.tasks[item.index];
  if (!task || task.missing.length > 0 || task.result === null) return false;
  const n = stroke.length;
  if (stroke[0][1] - stroke[n - 1][1] <
      Math.abs(stroke[0][0] - stroke[n - 1][0])) {
    return false;
  }
  task.result = null;
  console.log("handwriting.glow(task.result);")
  handwriting.glow(task.result);
//   helpers.set('grading', true);
  return true;
}


async function initTask(listName="82")
{

  console.log("initTask()")
  // listName="82"
  //
  const start = 46;
  const end = 159;

  for (let i = start; i <= end; i++) {
    practicelists.lists.push(i);
  }

  await axios.get('/getListAndCharacters',{
    params:{
      "listName":listName
    }
  }).then((res)=>{
    // alert("getList成功");
    console.log("getList成功");
    // console.log(res);
    item.taskList=res.data.list

    item.index = 0;

    item.tasks = res.data.characters.map((row, i) => ({

      data: row,
      index: i,
      matcher: new Matcher(row),
      // missing: _.range(row.medians.length),
      allMissing:Array.from(Array(row.medians.length).keys()),
      missing: Array.from(Array(row.medians.length).keys()),
      mistakes: 0,
      penalties: 0,
      recording: [],
      result: null,
      strokes: row.strokes,
    }));

    // console.log("tasks",item.tasks)

  }).catch((err)=>{
    console.log("getList失败");
    alert("网络错误，获取练字列表失败");
  });

  console.log("item",item)
  updataDescription();
}

const onRedo=()=>{
  // const task = item.tasks[item.index];
  console.log("onredo")
  item.tasks[item.index].missing=item.tasks[item.index].allMissing.slice();
  item.tasks[item.index].mistakes=0;
  item.tasks[item.index].penalties=0;
  item.tasks[item.index].recording=[];
  item.tasks[item.index].result=null;
  handwriting.clear(true);
  // handwriting.clearStage();
  // handwriting._reset();

}

const toggleDropdown=()=>{

  var arrow = document.getElementById("arrow");
  var dropdownContent = document.getElementById("dropdownContent");
  if (dropdownContent.style.display === "block") {
    dropdownContent.style.display = "none";
    arrow.innerHTML = "&#9650;"; // 向上箭头
  } else {
    dropdownContent.style.display = "block";
    arrow.innerHTML = "&#9660;"; // 向下箭头
  }

}

const onClick = () => {
  console.log("onClick");
  if (maybeAdvance()) return;
  const task = item.tasks[item.index];
  // const task=ini_task;
  task.penalties += kMaxPenalties;
  handwriting.flash(task.strokes[task.missing[0]]);
}

const onDouble = () => {
  console.log("onDouble");
  if (maybeAdvance()) return;
  const task = item.tasks[item.index];
  // if (task.penalties < kMaxPenalties) return;
  handwriting.reveal(task.strokes);
  handwriting.highlight(task.strokes[task.missing[0]]);
}


const onStroke = (stroke) => {
  console.log("onStroke");
  if (onRequestRegrade(stroke) || maybeAdvance()) return;
  const task = item.tasks[item.index];
  const result = task.matcher.match(stroke, task.missing);
  task.recording.push({indices: result.indices, stroke: stroke});
  // console.log("result",result)


  // The user's input does not match any of the character's strokes.
  // console.log("if (result.indices.length === 0)")
  if (result.indices.length === 0) {
    task.mistakes += 1;
    handwriting.fade();
    if (task.mistakes >= kMaxMistakes) {
      task.penalties += kMaxPenalties;
      handwriting.flash(task.strokes[task.missing[0]]);
    }
    return;
  }

  // Compute the matched path and the remaining missing strokes.
  const path = result.indices.map((x) => task.strokes[x]).join(' ');
  const missing = task.missing.filter((x) => result.indices.indexOf(x) < 0);
  // console.log("path",path)
  // console.log("missing",missing)

  // The user's input matches strokes that were already drawn.
  if (missing.length === task.missing.length) {
    task.penalties += 1;
    handwriting.undo();
    handwriting.flash(path);
    return;
  }

  // The user's input matches one or more of the missing strokes.
  task.missing = missing;
  console.log(missing);
  const rotate = result.simplified_median.length === 2;

  // console.log("path2",[path, rotate, result.source_segment,
  //   result.target_segment])
  handwriting.emplace([path, rotate, result.source_segment,
    result.target_segment]);
  if (result.warning) {
    task.penalties += result.penalties;
    //  禁用闪烁警告
    // handwriting.warn(result.warning);
  }

  // If the user finished the character, mark it complete. Otherwise, if they
  // drew a stroke out of order, penalize them and give them a hint.
  const index = _.min(result.indices);
  if (task.missing.length === 0) {
    console.log("practice list complete")
    // helpers.set('complete', true);

    //下面这句是完成字符绘制，触发相应事件，但是先注释
    //$(window).trigger('makemeahanzi-character-complete');

    task.result = getResult(task.penalties);
    console.log(task.result)
    handwriting.glow(task.result);
  } else if (task.missing[0] < index) {
    task.penalties += 2 * (index - task.missing[0]);
    handwriting.flash(task.strokes[task.missing[0]]);
  } else {
    task.mistakes = 0;
    handwriting.highlight(task.strokes[task.missing[0]]);
  }
}

const onRendered = function() {
  const options = {onclick: onClick, ondouble: onDouble, onstroke: onStroke};
  //   element = $(this.firstNode).find('.flashcard');
  element=document.querySelector('#canvasArea');
  // console.log(typeof element);

  //element是canvas的父级元素
  initTask();
  console.log('new Handwriting(element, options)');
  handwriting = new Handwriting(element, options);
}