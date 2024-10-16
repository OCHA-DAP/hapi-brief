////////////////////////////////////////////////////////////////////////
// Dynamic streaming data filters.
//
// Started 2024-10 by David Megginson
// Public Domain
////////////////////////////////////////////////////////////////////////


// Pseudo-namespace (change into module later)
let DF = {};


/**
 * Basic class to wrap an array.
 * Defines helper methods for derived classes.
 */
DF.Data = class {

    constructor(source) {
        this.source = source;
    }


    //
    // Value aggregators
    //

    sum (key) {
        let result = null;
        for (let row of this) {
            result += row[key];
        }
        return result;
    }

    min (key) {
        let result = null;
        for (let row of this) {
            if (row[key] !== null) {
                if (result === null || row[key] < result) {
                    result = row[key];
                }
            }
        }
        return result;
    }

    max (key) {
        let result = null;
        for (let row of this) {
            if (row[key] !== null) {
                if (result === null || row[key] > result) {
                    result = row[key];
                }
            }
        }
        return result;
    }

    average (key) {
        let result = null;
        let count = 0;
        for (let row of this) {
            if (row[key] !== null) {
                result += (row[key] / ++count);
            }
        }
        return result;
    }

    stddev (key) {
    }

    values (key) {
        let values = new Set();
        for (let row of this) {
            values.add(row[key]);
        }
        return Array.from(values);
    }

    contains (key, value) {
        for (let row of this) {
            if (row[key] == value) {
                return true;
            }
        }
        return false;
    }
    

    //
    // Row accessors
    //


    /**
     * Get a row by position.
     *
     * -1 means the last element.
     */
    get (n) {
        let row = null;
        let i = 0;
        for (row of this) {
            if (n == i++) {
                return row;
            }
        }
        if (n == -1) {
            return row;
        } else {
            return null;
        }
    }


    // Return the first row in the dataset.
    first () {
        return this.get(0);
    }


    // Return the last row in the dataset.
    last () {
        return this.get(-1);
    }

    // Return the number of rows in the dataset.
    length () {
        let i = 0;
        for (var row of this) {
            i++;
        }
        return i;
    }


    //
    // Streaming filters
    //

    // Make a static snapshot of the stream at this point
    cache () {
        return new DF.Cache(this);
    }

    // Return all the rows where key = value
    withRows (key, value) {
        return new DF.Select(this, row => { return row[key] == value; });
    }

     // Return all the rows where key != value
    withoutRows (key, value) {
        return new DF.Select(this, row => { return row[key] != value; });
    }

    // Aggregate rows for the keys specified
    aggregate (keys, dependent) {
        return new DF.Aggregate(this, keys, dependent);
    }

    // Sort rows according to the keys provided (if no keys, leave as-is)
    sort (keys, reverse) {
        return new DF.Sort(this, keys, reverse);
    }

    /**
     * Assumes a basic array. Override in derived classes.
     */
    [Symbol.iterator]() {
        return this.source.values();
    }

}

/**
 * Abstract base class for caching classes.
 */
DF.Cache = class extends DF.Data {

    constructor(source) {
        super(source);
        this.cached = null;
    }

    collect () {
        let rows = [];
        for (var row of this.source) {
            rows.push(row);
        }
        return rows;
    }
    
    [Symbol.iterator]() {
        if (this.cached === null) {
            this.cached = this.collect();
            this.source = null;
        }
        return this.cached[Symbol.iterator]();
    }
    
}


/**
 * Return only rows that pass the test supplied.
 */
DF.Select = class extends DF.Data {

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


/**
 * Aggregate a dependent variable for a set of independent variables.
 */
DF.Aggregate = class extends DF.Cache {

    constructor(source, keys, dependent) {
        super(source);
        this.keys = keys;
        this.dependent = dependent;
    }

    collect() {
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

}

/**
 * Sort data by the keys provided
 */
DF.Sort = class extends DF.Cache {

    constructor(source, keys, reverse) {
        super(source);
        this.keys = keys;
    }

    collect() {

        let filter = this;

        function compare (r1, r2) {
            for (let key of filter.keys) {
                if (r1[key] < r2[key]) {
                    return filter.reverse ? 1 : -1;
                } else if (r1[key] > r2[key]) {
                    return filter.reverse ? -1 : 1;
                }
            }
            return 0;
        }
        

        let rows = [];
        for (let row of this.source) {
            rows.push(row);
        }
        rows.sort(compare);

        return rows;
    }
    
}
