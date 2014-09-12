# Mapping

A set of directives to map places and things with angular. Supports the following mapping solutioons:

- Google Maps
- _Comming Soon: Mapbox_

## Usage

Include `mapping` module inside your application

```javascript
var app = angular.module('app', ['mapping']);
```

then add required directive markup

```html
<google-map latitude="-31.913289" longitude="115.779852" mark-center zoom="15"></google-map>
```

This example markup will generate a Google Map with

## Options

- `latitude` - Center the map at this latitude
- `longitude` - Center the map at this longitude
- `mark-center` - Add a pin at the provided center point

## To do

1. Add support for Mapbox
