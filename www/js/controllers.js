angular.module('starter.controllers', [])


.controller('WhatToEatCtrl',function($scope, $http, $ionicLoading,$ionicModal, $ionicPopover, $location,$localstorage, $q, lodash,PlacesApi ) {

        $ionicPopover.fromTemplateUrl('templates/options.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover = popover;
        });
        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };
        $scope.$on('$destroy', function() {
            $scope.popover.remove();
        });

        $scope.getMeters = function (miles) {
            return miles * 1609.344;
        };

        $scope.showLoading = function () {
            $ionicLoading.show({
                template: 'Loading...'
            });
        };
        $scope.hide = function () {
            $ionicLoading.hide();
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.distanceChanged = function (selected) {
            $scope.selected = selected.val;
            $localstorage.setObject('distanceOption', selected);
            $scope.getNewPlaces = true;
        };

        $scope.nextChoice = function () {
            if ($scope.getNewPlaces) {
                $scope.getPlaces($scope.selected);
                $scope.getNewPlaces = false;
            }

            $scope.choice = $scope.getNextChoice();
        };

        function getGeolocationCoordinates() {
            var deferred = $q.defer();
            navigator.geolocation.getCurrentPosition(
                function(position) { deferred.resolve(position.coords); },
                function() { deferred.resolve(null); }
            );
            return deferred.promise;
        }

        function callCityGridAPI(coords, miles, myLocation){
            var results;
            if(myLocation){
                results = PlacesApi.getCityGridPlacesWhere(myLocation);
            }
            else{
                var lat = coords.latitude,
                    long = coords.longitude;

                results = PlacesApi.getCityGridPlaces(lat, long, miles);
            }
            $q.all(results).then(function (data) {
                $scope.hide();
                var locations = lodash.flatten(lodash.map(data, function (d) {
                    return d.data.results.locations;
                }));
                $localstorage.setObject('places', locations);
                $localstorage.setObject('choices', locations.slice());
                $scope.choice = $scope.getNextChoice();
            }, function (error) {
                $scope.hide();
                alert('Unable to get restaurants!');
                console.log(error);
            });
        }

        $scope.getPlaces = function (miles) {
            $scope.showLoading();
            if($scope.myLocation){
                callCityGridAPI(null,null,$scope.myLocation)
            }
            else{
                getGeolocationCoordinates()
                .then(function(coords){callCityGridAPI(coords, miles)})
                .catch(function(error){
                    $scope.hide();
                    alert('Unable to get location: ' + error.message);
                });
            }
        };

        $scope.getNextChoice = function () {
            var choices = $localstorage.getObject('choices');
            if (choices.length === 0) {
                choices = $localstorage.getObject('places').slice();
                choices = $scope.filterChoices(choices);
            }
            lodash.shuffle(choices);
            var choice = choices.pop();
            $localstorage.setObject('choice', choice);
            $localstorage.setObject('choices', choices);
            return choice;
        };

        $scope.toggleSelection = function toggleSelection(option) {
            var indexOfOption = $scope.selectedFoods.indexOf(option);

            if (indexOfOption !== -1) {
                $scope.selectedFoods.splice(indexOfOption, 1);
            }
            else {
                $scope.selectedFoods.push(option);
            }
            $localstorage.setObject('selectedFoods',$scope.selectedFoods);
            var choices = $localstorage.getObject('places').slice();
            var filtered = $scope.filterChoices(choices);
            $localstorage.setObject('choices', lodash.shuffle(filtered));
        };

        $scope.filterChoices = function(choices){
            if($scope.selectedFoods.length === 0){
                return choices;
            }

            var filtered = lodash.map($scope.selectedFoods, function(food){
                return lodash.filter(choices,
                    function(location){
                        return location.sample_categories.indexOf(food) !== -1;
                    });
            });
            return lodash.flatten(filtered);
        };

        $ionicModal.fromTemplateUrl('templates/modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            if(lodash.isNumber($scope.myLocation)){
                $scope.zipCode = $scope.myLocation;
            }
            else if($scope.myLocation){
                $scope.cityState = $scope.myLocation;
            }
            $scope.modal.show();

        };
        $scope.closeModal = function(useCurrent, cityState, zipCode) {
            if(useCurrent){
                $scope.myLocation = null;
            }
            $scope.myLocation = cityState || zipCode;
            $scope.modal.hide();
            if(useCurrent || cityState || zipCode){
                $scope.getPlaces()
            }

        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        $scope.myLocation = null;
        $scope.distances = [
            {label: '5 miles', val: 5, id: 0},
            {label: '10 miles', val: 10, id: 1},
            {label: '25 miles', val: 25, id: 2}
        ];
        $scope.foodOptions = ['Chinese','Italian','Mexican','American'];
        $scope.selectedFoods = [];
        $scope.selected = $localstorage.getObject('distanceOption') || $scope.distances[1];
        $scope.selectedFoods = $localstorage.getObject('selectedFoods') || [];
        $scope.getNewPlaces = false;

        var places = $localstorage.getObject('places');
        if (!places || places.length === 0) {
            $scope.getPlaces($scope.selected);
        } else {
            $scope.choice = $localstorage.getObject('choice');
        }


    })
.controller('ChoiceDetailCtrl',function($scope, $location, $localstorage, PlacesApi, $compile ) {
        $scope.currentChoice = $localstorage.getObject('choice');
        PlacesApi.getCityGridPlaceDetail($scope.currentChoice.id)
            .success(function (data) {
                $scope.detail = data.locations[0];
                if ($scope.detail.contact_info) {
                    $scope.displayUrl = $scope.detail.contact_info.display_url || null;
                }
                $scope.hours = $scope.detail.business_hours || null;
            })
            .error(function (data) {
                console.log(data);
            });
        $scope.back = function () {
            $location.path('/whattoeat.html');
        };

        var myLatlng = new google.maps.LatLng($scope.currentChoice.latitude, $scope.currentChoice.longitude);

        var mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"),
            mapOptions);


        $scope.googleMapsLink = "geo:0,0?q=" + $scope.currentChoice.address.street + ", " + $scope.currentChoice.address.city + ", " + $scope.currentChoice.address.state + "";
        var contentString = "<div><a href='" + $scope.googleMapsLink + "' target='_system'>Driving Directions</a></div>";
        var compiled = $compile(contentString)($scope);

        var infowindow = new google.maps.InfoWindow({
            content: compiled[0]
        });

        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: $scope.currentChoice.name
        });

        google.maps.event.addListener(marker, 'click', function () {
            infowindow.open(map, marker);
        });

        $scope.map = map;
    });