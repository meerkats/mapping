angular.module('mapping', [])

/**
 * @ngdoc service
 * @name mapping.service:MarkerService
 * @description
 * Set of markers to be used within the map.
 */
.service('MarkerService', [function () {

    var _markers = [];

    /**
     * Marker object to contain required information for each pin.
     */
    var Marker = function (options) {
        if (!options.latitude || !options.longitude) {
            return null;
        }
        this.id = this.id; // @todo generate id fallback
        this.latitude = options.latitude;
        this.longitude = options.longitude;
        this.title = options.title || null;
    };

    /**
     * Add marker to marker set
     * @param {number} latitude Latitude for pin location
     * @param {number} longitude Longitude for pin location
     * @param {string} title Label for this marker
     * @return Marker object
     */
    var addMarker = function (latitude, longitude, title) {
        var marker = new Marker({
            latitude: latitude,
            longitude: longitude,
            title: title
        });
        _markers.push(marker);
        return marker;
    };

    /**
     * Remove all markers from data source
     */
    var clearMarkers = function () {
        _markers = [];
    };

    /**
     * Return all markers in the data source
     * @return Array of all active markers
     */
    var markers = function () {
        return _markers;
    };

    return {
        addMarker: addMarker,
        clearMarkers: clearMarkers,
        markers: markers
    };

}])

/**
 * @ngdoc controller
 * @name mapping.controller:GoogleMapController
 * @description
 * Controls interactive Google Map and interactive map markers
 */
.controller('GoogleMapController', ['$scope', 'MarkerService', function ($scope, MarkerService) {

    $scope.element = null;
    $scope.options = {};
    $scope.googlemap = null;

    var _markers = [];
    var AVAILABLE_OPTIONS = {
        'backgroundColor': String,
        'disableDefaultUI': Boolean,
        'disableDoubleClickZoom': Boolean,
        'draggable': Boolean,
        'draggableCursor': String,
        'draggingCursor': String,
        'heading': Number,
        'keyboardShortcuts': Boolean,
        'mapMaker': Boolean,
        'mapTypeControl': Boolean,
        'maxZoom': Number,
        'minZoom': Number,
        'noClear': Boolean,
        'overviewMapControl': Boolean,
        'panControl': Boolean,
        'rotateControl': Boolean,
        'scaleControl': Boolean,
        'scrollwheel': Boolean,
        'streetViewControl': Boolean,
        'tilt': Number,
        'zoom': Number,
        'zoomControl': Boolean,
        // @TODO UNSUPPORTED OPTIONS
        // 'center': LatLng,
        // 'mapTypeControlOptions': MapTypeControlOptions,
        // 'mapTypeId': MapTypeId,
        // 'overviewMapControlOptions': OverviewMapControlOptions,
        // 'panControlOptions': PanControlOptions,
        // 'rotateControlOptions': RotateControlOptions,
        // 'scaleControlOptions': ScaleControlOptions,
        // 'streetView': StreetViewPanorama,
        // 'streetViewControlOptions': StreetViewControlOptions,
        // 'styles': Array,
        // 'zoomControlOptions': ZoomControlOptions
    };

    /**
     * Initialize google map against provided element and options.
     * @param {object} element HTML element to use as Google Map container
     * @param {object} options Google Map options
     * @return Initialized Google Map object
     **/
    $scope.initialize = function (callback) {
        google.maps.event.addDomListener(window, 'load', function () {
            $scope.googlemap = new google.maps.Map($scope.element, $scope.options);
            $scope.$watch(function () { return MarkerService.markers(); }, function (markers) {
                markers.forEach(function (marker) {
                    var center = new google.maps.LatLng(marker.latitude, marker.longitude);
                    $scope.addMarker(center, marker.title, marker.title);
                });
            });
            if (typeof callback === 'function') {
                callback($scope);
            }

        });
    };

    /**
     * Set Google Maps API v3 `MapOption`
     * @see https://developers.google.com/maps/documentation/javascript/reference#MapOptions
     * @param {string} key MapOption property
     * @param {string} value MapOption value (can be string)
     */
    $scope.set = function (key, value) {
        Object.keys(AVAILABLE_OPTIONS).forEach(function (option) {
            if (option.toLowerCase() === key) {
                $scope.options[option] = AVAILABLE_OPTIONS[option](value);
            }
        });
    };

    /**
     * Add a new marker pin to visible map
     * @param {LatLng} position google.map.LatLng object for marker location
     * @param {string} id Reference ID for this marker
     * @param {string} title Human readable title to represent marker
     * @param {MarkerIcon} icon Visual icon to plot on map
     * @return MapMarker
     */
    $scope.addMarker = function (position, id, title, icon) {
        var marker = new google.maps.Marker({
            map: $scope.googlemap,
            position: position,
            title: title,
            icon: icon || null
        });
        marker.id = id;
        _markers.push(marker);
        return marker;
    };

    /**
     * Create valid map pin icon from provided image url at provided
     * image size (square)
     * @param {string} url URL for icon
     * @param {number} size Square size of the icon in pixels to display
     * @return Google MarkerImage
     */
    $scope.iconFromURL = function (url, size) {
        size = size || 50;
        return {
            origin: new google.maps.Point(0, 0),
            scaledSize: new google.maps.Size(size, size),
            url: url
        };
    };

}])

/**
 * @ngdoc directive
 * @name toggle.directive:googleMap
 * @restrict EA
 *
 * @description
 * Creates a Google Map with all available google map options
 */
.directive('googleMap', ['$timeout', 'MarkerService', function ($timeout, MarkerService) {

    return {
        restrict: 'EA',
        controller: 'GoogleMapController',
        link: function ($scope, element, attr) {
            var latitude = attr.latitude || 0;
            var longitude = attr.longitude || 0;
            var mark_center = 'markCenter' in attr || false;
            // set custom google map options from other attributes
            for (var opt in attr) {
                $scope.set(opt, attr[opt]);
            }
            $scope.options.center = new google.maps.LatLng(latitude, longitude);
            $scope.element = element[0];
            // Launch google map with current options
            $scope.initialize(function () {
                if (mark_center) {
                    $scope.$apply(function () {
                        MarkerService.addMarker(latitude, longitude, 'Hale School');
                    });
                }
            });

        }
    };

}]);
