angular.module('starter.services', [])
.constant('googleApiKey', '')
.constant('cityGridApiKey', '10000010458')
.factory('PlacesApi', function($http, lodash, cityGridApiKey) {

  return {
    getPlaces: function(lat,long,radius) {      
      radius = radius || 50000;
      return $http.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+lat+','+long+'&radius='+radius+'&types=restaurant&key='+googleApiKey);
    },
    getCityGridPlaces: function(lat,long,radius) {      
      radius = radius || 10;
      return lodash.map([1,2],function(page){
        return $http.get('https://api.citygridmedia.com/content/places/v2/search/latlon?format=json&rpp=50&type=restaurant&lat='+lat+'&lon='+long+'&radius='+radius+'&publisher='+cityGridApiKey+'&page='+page+'&sort=highestrated');
      });
    },
    getCityGridPlaceDetail: function(placeId){
      return $http.get('https://api.citygridmedia.com/content/places/v2/detail?format=json&id='+placeId+'&id_type=cs&placement=search_page&client_ip=123.4.56.78&publisher='+cityGridApiKey);
    }
  };
})
.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || null);
    }
  }
}]);
