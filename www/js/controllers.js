angular.module('starter.controllers', [])


.controller('WhatToEatCtrl',function($scope, $http, $ionicLoading,$location,$localstorage, $q, lodash,PlacesApi ){
		$scope.distances = [
		{label:'5 miles',val:5},
		{label:'10 miles',val:10},
		{label:'25 miles', val:25}
	];
	$scope.getNewPlaces = false;

	$scope.onSwipeRight = function(){
		$location.path( '/detail.html' );
	};

	$scope.getMeters = function(miles){
		return miles*1609.344;
	};

    $scope.showLoading = function() {
		$ionicLoading.show({
			template: 'Loading...'
		});
	};
	$scope.hide = function(){
		$ionicLoading.hide();
		$scope.$broadcast('scroll.refreshComplete');
	};

	$scope.update = function(selected){
		$scope.selected = selected.val;
		$scope.getNewPlaces = true;
	};

	$scope.nextChoice = function(){
		if($scope.getNewPlaces){
			$scope.getPlaces($scope.selected);
			$scope.getNewPlaces = false;
		}
		
		$scope.choice = $scope.getNextChoice();
	};

	$scope.getPlaces = function(miles){
		$scope.showLoading();
		navigator.geolocation.getCurrentPosition(function(pos) {
	         	
        	var lat = pos.coords.latitude,
        	long =  pos.coords.longitude;

			var results = PlacesApi.getCityGridPlaces(lat,long,miles);
			$q.all(results).then(function(data){
				$scope.hide();
				var places = lodash.flatten(lodash.map(data, function(d){return d.data.results.locations;}));
				$localstorage.setObject('places',places);
				$localstorage.setObject('choices',places.slice());
				$scope.choice = $scope.getNextChoice();
			}, function (error) {
				$scope.hide();
				alert('Unable to get resturaunts!');
    			console.log(error);
			}); 
        }, function(error) {
          $scope.hide();
          alert('Unable to get location: ' + error.message);
        });
	};

	$scope.getNextChoice = function(){
		var choices = $localstorage.getObject('choices');
		if(choices.length === 0){
			choices = $localstorage.getObject('places').slice();
		}
		shuffle(choices);
		var choice = choices.pop();
		$localstorage.setObject('choice',choice);
		$localstorage.setObject('choices',choices);
		return choice;
	};

	var places = $localstorage.getObject('places');

	if(!places || places.length === 0){
		$scope.getPlaces($scope.selected);	
	}else{
		$scope.choice = $localstorage.getObject('choice');
	}
	

})
.controller('ChoiceDetailCtrl',function($scope, $location, $localstorage, PlacesApi ){
	$scope.currentChoice = $localstorage.getObject('choice');
	$scope.back = function(){
		$location.path( '/whattoeat.html' );
	};
});



function shuffle(array) {
  var currentIndex = array.length,
   temporaryValue,
   randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}