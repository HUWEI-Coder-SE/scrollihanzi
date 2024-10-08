const assert = (condition, message) => {
    if (!condition) {
        console.error(message);
        throw new Error;
    }
}

class Shortstraw {
    constructor() {
        this.DIAGONAL_INTERVAL = 100;
        this.STRAW_WINDOW = 3;
        this.MEDIAN_THRESHOLD = 0.95;
        this.LINE_THRESHOLDS = [0.95, 0.90, 0.80];
    }
    run(points) {
        points = points.map((x) => ({x: x[0], y: x[1]}));
        const spacing = this._determineResampleSpacing(points);
        const resampled = this._resamplePoints(points, spacing);
        const corners = this._getCorners(resampled);
        return corners.map((i) => [resampled[i].x, resampled[i].y]);
    }
    _addAcuteAngles(points, corners) {
        const temp = corners.slice();
        corners.length = 1;
        for (let i = 1; i < temp.length; i++) {
            let best_index = null;
            let best_angle = Math.PI / 2;
            const cutoff = Math.max(1, Math.round(0.1 * (temp[i] - temp[i - 1])));
            for (let j = temp[i - 1] + cutoff; j <= temp[i] - cutoff; j++) {
                const angle = Math.abs(this._getAngle(
                    points, temp[i - 1], j, temp[i]));
                if (angle > best_angle) {
                    best_angle = angle;
                    best_index = j;
                }
            }
            if (best_index !== null) {
                corners.push(best_index);
            }
            corners.push(temp[i]);
        }
    }
    _determineResampleSpacing(points) {
        const box = this._getBoundingBox(points);
        const p1 = {x: box.x, y: box.y};
        const p2 = {x: box.x + box.w, y: box.y + box.h};
        const d = this._getDistance(p1, p2);
        return d / this.DIAGONAL_INTERVAL;
    }
    _getAngle(points, i, j, k) {
        const d1 = [points[j].x - points[i].x, points[j].y - points[i].y];
        const d2 = [points[k].x - points[j].x, points[k].y - points[j].y];
        const a1 = Math.atan2(d1[1], d1[0]);
        const a2 = Math.atan2(d2[1], d2[0]);
        const a = Math.abs(a2 - a1);
        if (a < -Math.PI) return a + 2 * Math.PI;
        if (a >= Math.PI) return a - 2 * Math.PI;
        return a;
    }
    _getBoundingBox(points) {
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        points.map((point) => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        });
        return {x: minX, y: minY, w: maxX - minX, h: maxY - minY};
    }
    _getCorners(points) {
        const corners = [0];
        const straws = new Array(points.length);
        const w = this.STRAW_WINDOW;
        for (let i = w; i < points.length - w; i++) {
            straws[i] = (this._getDistance(points[i - w], points[i + w]));
        }
        const t = this._median(straws) * this.MEDIAN_THRESHOLD;
        for (let i = w; i < points.length - w; i++) {
            if (straws[i] < t) {
                let localMin = Number.POSITIVE_INFINITY;
                let localMinIndex;
                while (i < straws.length && straws[i] < t) {
                    if (straws[i] < localMin) {
                        localMin = straws[i];
                        localMinIndex = i;
                    }
                    i++;
                }
                corners.push(localMinIndex);
            }
        }
        corners.push(points.length - 1);
        this.LINE_THRESHOLDS.map((threshold) => {
            this._postProcessCorners(points, corners, straws, threshold);
        });
        this._addAcuteAngles(points, corners);
        return corners;
    }
    _getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    _halfwayCorner(straws, a, b) {
        const quarter = (b - a) / 4;
        let minValue = Number.POSITIVE_INFINITY;
        let minIndex;
        for (var i = a + quarter; i < (b - quarter); i++) {
            if (straws[i] < minValue) {
                minValue = straws[i];
                minIndex = i;
            }
        }
        return minIndex;
    }
    _isLine(points, a, b, threshold) {
        const distance = this._getDistance(points[a], points[b]);
        const pathDistance = this._pathDistance(points, a, b);
        return (distance / pathDistance) > threshold;
    }
    _median(values) {
        const sorted = values.concat().sort();
        const i = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[i - 1] + sorted[i]) / 2;
        }
        return sorted[i];
    }
    _pathDistance(points, a, b) {
        let d = 0;
        for (let i = a; i < b; i++) {
            d += this._getDistance(points[i], points[i + 1]);
        }
        return d;
    }
    _postProcessCorners(points, corners, straws, threshold) {
        let go = false;
        let c1, c2;
        while (!go) {
            go = true;
            for (let i = 1; i < corners.length; i++) {
                c1 = corners[i - 1];
                c2 = corners[i];
                if (!this._isLine(points, c1, c2, threshold)) {
                    const newCorner = this._halfwayCorner(straws, c1, c2);
                    if (newCorner > c1 && newCorner < c2) {
                        corners.splice(i, 0, newCorner);
                        go = false;
                    }
                }
            }
        }
        for (let i = 1; i < corners.length - 1; i++) {
            c1 = corners[i - 1];
            c2 = corners[i + 1];
            if (this._isLine(points, c1, c2, threshold)) {
                corners.splice(i, 1);
                i--;
            }
        }
    }
    _resamplePoints(points, spacing) {
        const resampled = [points[0]];
        let distance = 0;
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i - 1];
            const p2 = points[i];
            const d2 = this._getDistance(p1, p2);
            if ((distance + d2) >= spacing) {
                const qx = p1.x + ((spacing - distance) / d2) * (p2.x - p1.x);
                const qy = p1.y + ((spacing - distance) / d2) * (p2.y - p1.y);
                const q = {x: qx, y: qy};
                resampled.push(q);
                points.splice(i, 0, q);
                distance = 0;
            } else {
                distance += d2;
            }
        }
        resampled.push(points[points.length - 1]);
        return resampled;
    }
}

const kMinFirstSegmentFraction = 0.1;
const kMinLastSegmentFraction = 0.05;
const kFontSize = 1024;
const kTruncation = 16;

const kShuWanGouShapes = [[[4, 0], [0, 4], [4, 0], [0, -1]],
    [[0, 4], [4, 0], [0, -1]]];

const fixMedianCoordinates = (median) => median.map((x) => [x[0], 900 - x[1]]);

const matchscale = (median, k) => median.map((point) => point.map((x) => k * x));

const dropDanglingHooks = (median) => {
    const n = median.length;
    if (n < 3) return median;
    const total = pathLength(median);
    const indices_to_drop = {};
    if (distance(median[0], median[1]) < kMinFirstSegmentFraction) {
        indices_to_drop[1] = true;
    }
    if (distance(median[n - 2], median[n - 1]) < kMinLastSegmentFraction) {
        indices_to_drop[n - 2] = true;
    }
    return median.filter((value, i) => !indices_to_drop[i]);;
}

const fixShuWanGou = (median) => {
    if (median.length === 2) return median;
    const indices_to_drop = {};
    for (let shape of kShuWanGouShapes) {
        if (match(median, shape)) {
            indices_to_drop[shape.length - 2] = true;
        }
    }
    return median.filter((value, i) => !indices_to_drop[i]);;
}

const distance = (point1, point2) => {
    const diff = [point1[0] - point2[0], point1[1] - point2[1]];
    return Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);
}

const findCorners = (medians) => {
    const shortstraw = new Shortstraw;
    return medians.map(fixMedianCoordinates)
        .map((x) => truncate(x, kTruncation))
        .map((x) => matchscale(x, 1 / kFontSize))
        .map(shortstraw.run.bind(shortstraw))
        .map(dropDanglingHooks)
        .map(fixShuWanGou);
}

const pathLength = (median) => {
    let total = 0;
    _.range(median.length - 1).map(
        (i) => total += distance(median[i], median[i + 1]));
    return total;
}

const refine = (median, n) => {
    const total = pathLength(median);
    const result = [];
    let index = 0;
    let position = median[0];
    let total_so_far = 0;
    for (let i of _.range(n - 1)) {
        const target = i*total/(n - 1);
        while (total_so_far < target) {
            const step = distance(position, median[index + 1]);
            if (total_so_far + step < target) {
                index += 1;
                position = median[index];
                total_so_far += step;
            } else {
                const t = (target - total_so_far)/step;
                position = [(1 - t)*position[0] + t*median[index + 1][0],
                    (1 - t)*position[1] + t*median[index + 1][1]];
                total_so_far = target;
            }
        }
        result.push([position[0], position[1]]);
    }
    result.push(median[median.length - 1]);
    return result;
}

const truncate = (median, truncation) => {
    const n = 64;
    const length = pathLength(median);
    const index = Math.round(n * Math.min(truncation / length, 0.25));
    return refined = refine(median, n).slice(index, n - index);
}

const path_radical_callback = (rects) => {
    const output = [rects[0].tl, rects[0].tr];
    output.push([rects[0].l, 0.5 * rects[0].t + 0.5 * rects[0].b]);
    output.push([rects[0].r, 0.5 * rects[0].t + 0.5 * rects[0].b]);
    output.push(rects[0].bl);
    return [
        output,
        output.slice(0, 3).concat(output.slice(4)),
        output.slice(0, 2).concat(output.slice(4)),
    ];
};

const kShortcuts = [
    {
        targets: [
            [['女', 1], ['女', 2]],
        ],
        callback: (rects) => {
            if (rects[0].r < rects[1].r) return [];
            return [[rects[1].bl, [rects[0].r, rects[1].t], rects[0].bl]];
        },
    },
    {
        targets: [
            [['了', 0], ['了', 1]],
            [['孑', 0], ['孑', 1]],
        ],
        callback: (rects) => {
            const output = [rects[0].tl, rects[0].tr, rects[1].tr, rects[1].br];
            output.push([rects[1].l, rects[1].b + rects[1].l - rects[1].r]);
            return [output, output.slice(0, 2).concat(output.slice(3))];
        },
    },
    {
        targets: [
            [['纟', 0], ['纟', 1]],
            [['幺', 0], ['幺', 1]],
        ],
        callback: (rects) => {
            const output = [rects[0].tr, rects[0].bl, rects[1].tr, rects[1].bl];
            output.push([rects[1].r, 0.25 * rects[1].t + 0.75 * rects[1].b]);
            return [output];
        },
    },
    {
        targets: [
            [['廴', 0]],
            [['辶', 1]],
        ],
        callback: path_radical_callback,
    },
    {
        targets: [
            [['廴', 0], ['廴', 1]],
            [['辶', 1], ['辶', 2]],
        ],
        callback: (rects) => {
            const options = path_radical_callback([rects[0]]);
            return options.map((x) => x.concat([rects[1].br]));
        },
    },
    {
        targets: [
            [['成', 2]],
        ],
        callback: (rects) => {
            const output = [rects[0].tl, rects[0].tr, rects[0].br];
            const midpoint = 0.5 * rects[0].l + 0.5 * rects[0].r;
            output.push([midpoint, 0.25 * rects[0].t + 0.75 * rects[0].b]);
            return [output, output.slice(0, 3)];
        },
    },
];

const componentsMatch = (components, target) => {
    if (components.length < target.length) return false;
    for (let i = 0; i < target.length; i++) {
        if (components[i][target[i][0]] !== target[i][1]) return false;
    }
    return true;
}

const computeBounds = (median) => {
    const xs = median.map((point) => point[0]);
    const ys = median.map((point) => point[1]);
    const result = {l: _.min(xs), r: _.max(xs), t: _.min(ys), b: _.max(ys)};
    result.tl = [result.l, result.t];
    result.tr = [result.r, result.t];
    result.bl = [result.l, result.b];
    result.br = [result.r, result.b];
    return result;
}

const getShortcuts = (components, medians) => {
    assert(components.length === medians.length);
    const result = [];
    for (let i = 0; i < components.length; i++) {
        for (let shortcut of kShortcuts) {
            const remainder = components.slice(i);
            if (_.any(shortcut.targets, (x) => componentsMatch(remainder, x))) {
                const n = shortcut.targets[0].length;
                const bounds = medians.slice(i, i + n).map(computeBounds);
                const indices = _.range(i, i + n);
                for (let median of shortcut.callback(bounds)) {
                    result.push({indices: indices, median: median});
                }
            }
        }
    }
    return result;
}




const kAngleThreshold = Math.PI / 5;
const kDistanceThreshold = 0.3;
const kLengthThreshold = 1.5;
const kMaxMissedSegments = 1;
const kMaxOutOfOrder = 2;
const kMinDistance = 1 / 16;
const kMissedSegmentPenalty = 1;
const kOutOfOrderPenalty = 2;
const kReversePenalty = 2;

const kHookShapes = [[[1, 3], [-3, -1]], [[3, 3], [0, -1]]];

const util = {
    distance2: (point1, point2) => util.norm2(util.subtract(point1, point2)),
    clone: (point) => [point[0], point[1]],
    norm2: (point) => point[0]*point[0] + point[1]*point[1],
    round: (point) => point.map(Math.round),
    subtract: (point1, point2) => [point1[0] - point2[0], point1[1] - point2[1]],
};

const angleDiff = (angle1, angle2) => {
    const diff = Math.abs(angle1 - angle2);
    return Math.min(diff, 2 * Math.PI - diff);
}

const getAngle = (median) => {
    const diff = util.subtract(median[median.length - 1], median[0]);
    return Math.atan2(diff[1], diff[0]);
}

const getBounds = (median) => {
    const min = [Infinity, Infinity];
    const max = [-Infinity, -Infinity];
    median.map((point) => {
        min[0] = Math.min(min[0], point[0]);
        min[1] = Math.min(min[1], point[1]);
        max[0] = Math.max(max[0], point[0]);
        max[1] = Math.max(max[1], point[1]);
    });
    return [min, max];
}

const getMidpoint = (median) => {
    const bounds = getBounds(median);
    return [(bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2];
}

const getMinimumLength = (pair) =>
    Math.sqrt(util.distance2(pair[0], pair[1])) + kMinDistance;

const hasHook = (median) => {
    if (median.length < 3) return false;
    if (median.length > 3) return true;
    for (let shape of kHookShapes) {
        if (match(median, shape)) return true;
    }
    return false;
}

//函数检查给定的笔画是否与给定的形状匹配
const match = (median, shape) => {
    if (median.length !== shape.length + 1) return false;
    for (let i = 0; i < shape.length; i++) {
        const angle = angleDiff(getAngle(median.slice(i, i + 2)),
            getAngle([[0, 0], shape[i]]));
        if (angle >= kAngleThreshold) return false;
    }
    return true;
}

//函数执行笔画之间的匹配和对齐。
const performAlignment = (source, target) => {
    source = source.map(util.clone);
    target = target.map(util.clone);
    const memo = [_.range(source.length).map((j) => j > 0 ? -Infinity : 0)];
    for (let i = 1; i < target.length; i++) {
        const row = [-Infinity];
        for (let j = 1; j < source.length; j++) {
            let best_value = -Infinity;
            const start = Math.max(j - kMaxMissedSegments - 1, 0);
            for (let k = start; k < j; k++) {
                if (memo[i - 1][k] === -Infinity) continue;
                const score = scorePairing(
                    [source[k], source[j]], [target[i - 1], target[i]], i === 1);
                const penalty = (j - k - 1) * kMissedSegmentPenalty;
                best_value = Math.max(best_value, score + memo[i - 1][k] - penalty);
            }
            row.push(best_value);
        }
        memo.push(row);
    }
    const result = {score: -Infinity, source: null, target: null, warning: null};
    const min_matched = target.length - (hasHook(target) ? 1 : 0);
    for (let i = min_matched - 1; i < target.length; i++) {
        const penalty = (target.length - i - 1) * kMissedSegmentPenalty;
        const score = memo[i][source.length - 1] - penalty;
        if (score > result.score) {
            result.penalties = 0;
            result.score = score;
            result.source = [source[0], source[source.length - 1]];
            result.target = [target[0], target[i]];
            result.warning = i < target.length - 1 ? 'Should hook.' : null;
        }
    }
    return result;
}

//函数尝试识别用户输入的笔画并与目标笔画进行匹配。
const recognize = (source, target, offset) => {
    if (offset > kMaxOutOfOrder) return {score: -Infinity};
    let result = performAlignment(source, target);
    if (result.score === -Infinity) {
        let alternative = performAlignment(source.slice().reverse(), target);
        if (!alternative.warning) {
            result = alternative;
            result.penalties += 1;
            result.score -= kReversePenalty;
            result.warning = 'Stroke backward.';
        }
    }
    result.score -= Math.abs(offset) * kOutOfOrderPenalty;
    return result;
}

//函数评估两个笔画对之间的匹配得分。
const scorePairing = (source, target, is_initial_segment) => {
    const angle = angleDiff(getAngle(source), getAngle(target));
    const distance = Math.sqrt(util.distance2(
        getMidpoint(source), getMidpoint(target)));
    const length = Math.abs(Math.log(
        getMinimumLength(source) / getMinimumLength(target)));
    if (angle > (is_initial_segment ? 1 : 2) * kAngleThreshold ||
        distance > kDistanceThreshold || length > kLengthThreshold) {
        return -Infinity;
    }
    return -(angle + distance + length);
}



class Matcher {

    constructor(character_data) {

        this._medians = character_data.medians.map((x) => findCorners([x])[0]);


        this._shortcuts = getShortcuts(character_data.components, this._medians);

        this._candidates = this._medians.map((x, i) => ({indices: [i], median: x}))
            .concat(this._shortcuts);
    }


    //此处的stroke也是手写的stroke
    match(stroke, missing) {
        assert(missing.length > 0, "Must have at least one missing stroke!");
        // Run a corner detection algorithm tuned for recall to simplify the
        // medians of the user's strokes.
        stroke = (new Shortstraw).run(stroke);

        let best_result = {indices: [], score: -Infinity};
        // 每个candidate对应一个stroke
        this._candidates.forEach((candidate, i) => {
            if (!viable(candidate.indices, missing)) return;
            const first_index = _.min(candidate.indices);
            const offset = first_index - missing[0];
            // console.log("stroke",stroke);
            // console.log("candidate.median",candidate.median);
            const result = recognize(stroke, candidate.median, offset);
            if (result.score > best_result.score) {
                best_result = {
                    indices: candidate.indices,
                    penalties: result.penalties,
                    score: result.score,
                    source_segment: result.source,
                    simplified_median: candidate.median,
                    target_segment: result.target,
                    warning: result.warning,
                };
            }
        });
        return best_result;
    }
}