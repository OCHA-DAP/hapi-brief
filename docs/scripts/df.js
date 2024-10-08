class DFBase {

    constructor() {
    }

    withRows (key, value) {
        return new DFSelect(this, row => { return row[key] == value; });
    }
    
    withoutRows (key, value) {
        return new DFSelect(this, row => { return row[key] != value; });
    }

    aggregate (keys, dependent) {
        return new DFAggregate(this, keys, dependent);
    }

}

class DFFilterBase {

    constructor(source) {
        this.source = source;
    }
    
}


/**
 * Wrap a raw array of JSON objects.
 */
class DFRaw extends DFBase {

    constructor(raw_data) {
        super();
        this.raw_data = raw_data;
    }

    [Symbol.iterator]() {

        let index = -1;
        let data = this.raw_data;

        return {
            next: () => ({value: data[++index], done: !(index in data)})
        };
    }
}


/**
 * Return only rows that pass the test supplied.
 */
class DFSelect extends DFFilterBase {

    constructor(source, test) {
        super(source);
        this.test = test;
    }

    [Symbol.iterator]() {
        let index = 0;
        let it = this.source[Symbol.iterator]();
        let test = this.test;

        return {
            next: () => {
                let result = it.next();
                while (!result.done) {
                    if (test(result.value)) {
                        return result;
                    }
                    result = it.next();
                }
                return result;
            }
        }
        
    }
    
}

class DFAggregate extends DFFilterBase {

    constructor(source, keys, dependent) {
        super(source);
        this.keys = keys;
        this.dependent = dependent;
    }

    aggregate() {
        let accumulator = {};
        let tuples = [];

        // Find all the unique combinations
        for (var row of this.source) {
            let values = {};
            for (var key of this.keys) {
                values[key] = row[key];
            }
            let encoded = JSON.stringify(values);
            if (encoded in accumulator) {
                if (this.dependent) {
                    let v = row[this.dependent];
                    accumulator[encoded]['_avg'] = (accumulator[encoded]["_avg"] * accumulator[encoded]["_count"] + v) / (accumulator[encoded]["_count"] + 1);
                    if (v < accumulator[encoded]['_min']) {
                        accumulator[encoded]['_min'] = v;
                    }
                    if (v > accumulator[encoded]['_max']) {
                        accumulator[encoded]['_max'] = v;
                    }
                }
                accumulator[encoded]['_count']++;
            } else {
                accumulator[encoded] = {
                    _count: 1,
                };
                if (this.dependent) {
                    let v = row[this.dependent];
                    accumulator[encoded]['_avg'] = v;
                    accumulator[encoded]['_min'] = v;
                    accumulator[encoded]['_max'] = v;
                }
            }
        }

        // Parse the combinations back into arrays
        for (var key of Object.keys(accumulator)) {
            let entry = JSON.parse(key);
            tuples.push({...entry, ...accumulator[key]});
        }
        
        return tuples;
    }

    [Symbol.iterator]() {
        let tuples = this.aggregate();
        return tuples[Symbol.iterator]();
    }
    
    
}
