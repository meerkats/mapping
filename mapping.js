angular.module('mapping', [])
  /**
   * @ngdoc service
   * @name mapping.service:GoogleService
   * @description
   * Asynchronously load the Google API.
   */
   // @ngInject
  .factory('GoogleService', function ($q, $window) {
    // Google's url for async maps initialization accepting callback function
    var callbackName = 'initializeMaps';
    var mapsUrl = 'https://maps.googleapis.com/maps/api/js?v=3.exp&signed_in=false&callback=';
    var mapsDefer = $q.defer();

    $window[callbackName] = mapsDefer.resolve;

    // Start loading google maps
    (function () {
      var script = document.createElement('script');
      script.src = mapsUrl + callbackName;
      document.body.appendChild(script);
    })();

    return {
      initialized: mapsDefer.promise
    };
  })
  /**
   * @ngdoc service
   * @name mapping.service:MarkerService
   * @description
   * Set of markers to be used within the map.
   */
  .service('MarkerService', function () {
    var markers = [];
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
      this.icon = options.icon || null;
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
        title: title,
        icon: icon
      });
      markers.push(marker);
      return marker;
    };

    /**
     * Remove all markers from data source
     */
    var clearMarkers = function () {
      markers = [];
    };

    /**
     * Return all markers in the data source
     * @return Array of all active markers
     */
    var getMarkers = function () {
      return markers;
    };

    return {
      addMarker: addMarker,
      clearMarkers: clearMarkers,
      getMarkers: getMarkers
    };
  })
  /**
   * @ngdoc service
   * @name mapping.service:GoogleMapController
   * @description
   * Service interactive Google Map and interactive map markers
   */
  // @ngInject
  .service('GoogleMapService', function ($timeout, $q, $window, GoogleService, MarkerService) {
    var service = this;
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
    };
    this.markers = [];
    this.element = null;
    this.options = {};
    this.googlemap = null;
    this.defaultIcon = null;

    /**
     * Set Google Maps API v3 `MapOption`
     * @see https://developers.google.com/maps/documentation/javascript/reference#MapOptions
     * @param {string} key MapOption property
     * @param {string} value MapOption value (can be string)
     */
    this.set = function (key, value) {
      angular.forEach(AVAILABLE_OPTIONS, function (optionValue, optionKey) {
        if (optionKey.toLowerCase() === key) {
          var updatedValue = value;
          if (optionValue === Boolean) {
            updatedValue = (value === '' || value === 'true') ? true : false;
          }
          service.options[optionKey] = AVAILABLE_OPTIONS[optionKey](updatedValue);
        }
      });
    };

    /**
     * Initialize google map against provided element and options.
     * @param {object} element HTML element to use as Google Map container
     * @param {object} options Google Map options
     * @return Initialized Google Map object
     */
    this.initialize = function (callback) {
      var isInitialized = false;
      var googleDefer = $q.defer();
      var initialize = function () {
        if (isInitialized) {
          return callback($scope);
        }
        service.googlemap = new google.maps.Map(service.element, service.options);
        $timeout(function () {
          service.refresh();
        });
        if (typeof callback === 'function') {
          return callback($scope);
        }
        googleDefer.resolve();
      };
      google.maps.event.addDomListener(window, 'load', initialize);
      setTimeout(initialize, 1500); // fallback for IE8
      return googleDefer.promise;
    };

    /**
     * Refresh map markers, redraw each marker to ensure everything is up to
     * date with the MarkerService
     */
    this.refresh = function () {
      var markers = MarkerService.getMarkers();
      if ($window.google) {
        service.markers = [];
        angular.forEach(markers, function (marker) {
          if (marker.icon) {
            marker.icon = service.iconFromURL(marker.icon.url,
                                             marker.icon.size,
                                             marker.icon.scaledSize,
                                             marker.icon.anchor);
          }
          service.addMarker(new google.maps.LatLng(marker.latitude, marker.longitude),
                            marker.title,
                            marker.title,
                            marker.icon);
        });
      }
    };

    /**
     * Add a new marker pin to visible map
     * @param {LatLng} position google.map.LatLng object for marker location
     * @param {string} id Reference ID for this marker
     * @param {string} title Human readable title to represent marker
     * @param {MarkerIcon} icon Visual icon to plot on map
     * @return MapMarker
     */
    this.addMarker = function (position, id, title, icon) {
      var marker = new google.maps.Marker({
        map: service.googlemap,
        position: position,
        title: title,
        id: id,
        icon: icon || service.defaultIcon
      });
      service.markers.push(marker);
      return marker;
    };

    /**
     * Create valid map pin icon from provided image url at provided
     * image size (square)
     * @param {string} url URL for icon
     * @param {object} size 'width' and 'height' dimensions of the icon in pixels to display
     * @param {object} anchor 'x' and 'y' offsets of the icon in pixels to display
     * @return Google MarkerImage
     */
    this.iconFromURL = function (url, size, scaledSize, anchor) {
      var newSize = angular.extend({ width: 50, height: 50 }, size);
      var newScaledSize = angular.extend({ width: newSize.width / 2, height: newSize.height / 2 }, scaledSize);
      var newAnchor = angular.extend({ x: newSize.width / 2, y: newSize.height }, anchor);
      return {
        anchor: new google.maps.Point(newAnchor.x, newAnchor.y),
        origin: new google.maps.Point(0, 0),
        scaledSize: new google.maps.Size(newScaledSize.width, newScaledSize.height),
        size: new google.maps.Size(newSize.width, newSize.height),
        url: url
      };
    };
  })
  /**
   * @ngdoc controller
   * @name mapping.controller:GoogleMapController
   * @description
   * Service interactive Google Map and interactive map markers
   */
  // @ngInject
  .controller('GoogleMapController', function ($scope, MarkerService, GoogleMapService) {
    // Update markers
    $scope.$watch(MarkerService.getMarkers, GoogleMapService.refresh);
  })
  /**
   * @ngdoc directive
   * @name toggle.directive:googleMap
   * @restrict EA
   *
   * @description
   * Creates a Google Map with all available google map options
   */
   // @ngInject
  .directive('googleMap', function ($rootScope, GoogleService, GoogleMapService) {
    return {
      restrict: 'EA',
      link: function ($scope, element, attr) {
        attr.latitude = attr.latitude || 0;
        attr.longitude = attr.longitude || 0;
        attr.zoom = attr.zoom || 16;

        // set custom google map options from other attributes
        // @see GoogleMapController for supported options
        Object.keys(attr).forEach(function (option) {
          GoogleMapService.set(option, attr[option]);
        });
        GoogleService.initialized.then(function () {
          GoogleMapService.options.center = new google.maps.LatLng(attr.latitude, attr.longitude);
          GoogleMapService.element = element[0];
          GoogleMapService.initialize().then(function () {
            function repositionMap() {
              GoogleMapService.options.center = new google.maps.LatLng(attr.latitude, attr.longitude);
              GoogleMapService.googlemap.setCenter(GoogleMapService.options.center);
            }
            function rezoomMap() {
              GoogleMapService.options.zoom = parseInt(attr.zoom, 10);
              GoogleMapService.googlemap.setZoom(GoogleMapService.options.zoom);
            }
            attr.$observe('latitude', repositionMap);
            attr.$observe('longitude', repositionMap);
            attr.$observe('zoom', rezoomMap);
            GoogleMapService.refresh();
          });
        });
      }
    };
  })
  /**
   * @ngdoc directive
   * @name toggle.directive:markerOnCenter
   * @restrict A
   *
   * @description
   * Adds a marker icon to the center of your map
   */
   // @ngInject
  .directive('markerOnCenter', function (MarkerService, GoogleMapService) {
    return {
      restrict: 'A',
      link: function ($scope, element, attr) {
        var latitude = attr.latitude || 0;
        var longitude = attr.longitude || 0;
        MarkerService.addMarker(latitude, longitude);
        GoogleMapService.refresh();
      }
    };
  })
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
   // @ngInject
  .directive('markerIcon', function (GoogleMapService) {
    return {
      restrict: 'A',
      scope: {
        markerIcon: '=markerIcon'
      },
      link: function ($scope) {
        GoogleMapService.defaultIcon = $scope.markerIcon;
      }
    };
  });
