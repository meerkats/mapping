angular.module('mapping', [])

/**
 * @ngdoc service
 * @name mapping.service:MarkerService
 * @description
 * Set of markers to be used within the map.
 */
.service('MarkerService', [
function () {

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
    var addMarker = function (latitude, longitude, title, icon) {
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
.controller('GoogleMapController', ['$scope', '$timeout', 'MarkerService',
function ($scope, $timeout, MarkerService) {

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

    $scope.element = null;
    $scope.options = {};
    $scope.googlemap = null;
    $scope.default_icon = null;

    /**
     * Set Google Maps API v3 `MapOption`
     * @see https://developers.google.com/maps/documentation/javascript/reference#MapOptions
     * @param {string} key MapOption property
     * @param {string} value MapOption value (can be string)
     */
    $scope.set = function (key, value) {
        angular.forEach(AVAILABLE_OPTIONS, function (_value, _key) {
            if (_key.toLowerCase() === key) {
                if (_value === Boolean) {
                    value = (value === '' || value === 'true') ? true : false;
                }
                $scope.options[_key] = AVAILABLE_OPTIONS[_key](value);
            }
        });
    };

    /**
     * Initialize google map against provided element and options.
     * @param {object} element HTML element to use as Google Map container
     * @param {object} options Google Map options
     * @return Initialized Google Map object
     */
    $scope.initialize = function (callback) {
        var _initialized = false;
        var _initialize = function () {
            if (_initialized) {
                return;
            }
            $scope.googlemap = new google.maps.Map($scope.element, $scope.options);
            $timeout(function () {
                $scope.refresh();
            });
            if (typeof callback === 'function') {
                callback($scope);
            }
        };
        google.maps.event.addDomListener(window, 'load', _initialize);
        setTimeout(_initialize, 1500); // fallback for IE8
    };

    /**
     * Refresh map markers, redraw each marker to ensure everything is up to
     * date with the MarkerService
     */
    $scope.refresh = function () {
        _markers = [];
        var markers = MarkerService.markers();
        angular.forEach(markers, function (marker) {
            $scope.addMarker(new google.maps.LatLng(marker.latitude, marker.longitude),
                             marker.title,
                             marker.title);
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
            id: id,
            icon: icon || $scope.default_icon
        });
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

    // Update markers
    $scope.$watch(function () { return MarkerService.markers(); }, function () {
        $scope.refresh();
    });

}])

/**
 * @ngdoc directive
 * @name toggle.directive:googleMap
 * @restrict EA
 *
 * @description
 * Creates a Google Map with all available google map options
 */
.directive('googleMap', ['MarkerService',
function (MarkerService) {
    return {
        restrict: 'EA',
        controller: 'GoogleMapController',
        link: function ($scope, element, attr) {
            var latitude = attr.latitude || 0;
            var longitude = attr.longitude || 0;
            // set custom google map options from other attributes
            // @see GoogleMapController for supported options
            for (var opt in attr) {
                $scope.set(opt, attr[opt]);
            }
            $scope.options.center = new google.maps.LatLng(latitude, longitude);
            $scope.element = element[0];
            $scope.initialize();
        }
    };
}])

/**
 * @ngdoc directive
 * @name toggle.directive:markerOnCenter
 * @restrict A
 *
 * @description
 * Adds a marker icon to the center of your map
 */
.directive('markerOnCenter', ['MarkerService',
function (MarkerService) {
    return {
        restrict: 'A',
        controller: 'GoogleMapController',
        link: function ($scope, element, attr) {
            var latitude = attr.latitude || 0;
            var longitude = attr.longitude || 0;
            MarkerService.addMarker(latitude, longitude);
            $scope.refresh();
        }
    };
}])

/**
 * @ngdoc directive
 * @name toggle.directive:markerIcon
 * @restrict A
 *
 * @description
 * Sets default map icon as per specifications of your mapping tool.
 * This can be provided as JSON (e.g. `marker-icon="{ url: xxx }"`) or
 * as an expressions pointing to a scope variable (e.g. `marker-icon="icon"`).
 */
.directive('markerIcon', ['MarkerService',
function (MarkerService) {
    return {
        restrict: 'A',
        controller: 'GoogleMapController',
        scope: {
            markerIcon: '=markerIcon'
        },
        link: function ($scope, element, attr) {
            $scope.$parent.default_icon = $scope.markerIcon;
        }
    };
}]);
