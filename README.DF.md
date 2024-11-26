Data Filter library (DF)
========================

This package includes a small Javascript library for dynamic data filtering, [df.js](docs/scripts/df.js).  The design goal is to allow dynamic, lazy data filtering in templates.  When you wrap a list of Javascript objects in a ``DF.Data object``, nothing happens until someone actually requests processing. The filtering methods are chainable.  Here's an example:

    let data = new DF.Data(raw_data);   
    let filtered_data = data.withRows('date', '2024-11-01').withoutRows('sector_name', 'Water and Sanitation');
    
In this example, you can iterate through filtered data, and get only the Javascript objects that have a property ``date`` set to "2024-11-01" and _don't_ have a properly ``sector_name`` set to "Water and Sanitation".  This is especially useful in templating systems like Nunjucks, since the templates can easily filter data to get what they want:

    {% for row in data.withRows('population_status', 'AFF') %}
      <p>{{ row.date }}: {{ row.population }}</p>
    {% endfor %}
    
The library does not make a copy of the data unless you request one:

    let cached_data = data.withRows('date', '2024-11-01').withoutRows('sector_name', 'Water and Sanitation').cache();
    

## DF.Data class

This class is the heart of the Data Filter library (the other classes will be used behind the scenes).  It provides the methods that you can chain together into a dynamic data-processing pipeline.


### Constructor

#### DF.Data(source)

Create a new filtered-data object.

    let data = new DF.Data(raw_data);


### Aggregators

These methods extract a single value or list of values from an entire filtered dataset.

#### DF.Data.sum(key)

Return the sum of all numeric values with the property name ``key`` (non-numeric values are ignored).

    let female_population = data.withRows('gender', 'f').sum('population');

#### DF.Data.min(key)

Return the minimum value (numeric or lexical) with the property name ``key``.

    let min_date = data.min('reference_period_start');

#### DF.Data.max(key)

Return the maximum value (numeric or lexical) with the property name ``key``.

    let max_date = data.max('reference_period_end');

#### DF.Data.average(key)

Return the average (mean) of values with the property name ``key`` (non-numeric values are ignored).

    let average_funding = data.average('funding_usd');

#### DF.Data.values(key)

Return a list of unique values for ``key`` (excluding null).

    let statuses = data.values('status');

#### DF.Data.contains(key, value)

Returns true if ``value`` appears anywhere in the dataset for ``key``.

    let has_idps = data.contains('population_status', 'IDP');


### Accessors

These methods allow quick access to a specific row in the filtered data.

#### DF.Data.get(n)

Get the Javascript object at position ``n`` in the dataset (or null if it doesn't exist).  ``n is zero-based``.

    let row = data.get(5); # get the 6th object

#### DF.Data.first()

Get the first Javascript object in the dataset.  Equivalent to ``data.get(0)``.

    let first_dated_entry = data.withRows(data.min('date')).first();

#### DF.Data.last()

Get the last Javascript object in the dataset.  Equivalent to ``data.get(data.length()-1)``

    let last_dated_entry = data.withRows(data.max('date')).last();

#### DF.Data.length()

Get the number of Javascript objects in the dataset.

    let afg_org_count = data.withRows('location_code', 'AFG').length();

### Filters

The filter methods create a virtual copy of the data, omitting certain rows or rearranging rows.  The methods are chainable, so you can make indefinitely-long pipelines.

#### DF.Data.cache()

Make a static snapshot of the current state of the data (to save repeating complex computations).

    let affected_people = data.withRows('population_status', 'AFF').cache();

#### DF.Data.filter(test)

Create a virtual copy of the dataset containing only the objects that pass the test function provided (this won't usually work in templating languages).

    let high_impact_areas = data.withRows('population_status', 'AFF').test(r => r.population > 10000);

#### DF.Data.withRows(key, value)

Create a virtual copy of the dataset including only objects where ``key`` is set to ``value``.

    let in_need = data.withRows('population_status', 'INN');

#### DF.Data.withoutRows(key, value)

Create a virtual copy of the dataset including only objects where ``key`` is _not_ set to ``value``.

    let no_education = data.withoutRows('sector_code', 'EDU');

#### DF.Data.aggregate(keys, dependent)

Aggregate a dependent variable ``dependent`` for a list of independent variables ``keys``, similar to a spreadsheet pivot table.

    let by_gender_agerange = data.aggregate(['gender', 'age_range'], 'population')
    
This method creates a cache implicitly.

#### DF.Data.sort(keys, reverse)

Sort the list of objects by the property names ``keys``, numerically or lexically.  If ``reverse`` (optional) is ``true``, sort in reverse order.

    let sorted_data = data.sort(['org_name', 'sector_name'])
    
This method creates a cache implicitly.


