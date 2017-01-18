angular.module('itBirthday.outlook', [])
  .controller('OutlookCtrl', function ($scope, $http, ionicLoadingService, $ionicPopup) {
    $scope.outlookLink = {};
    $scope.email = undefined;
    $scope.expirationDate = undefined;
    $scope.isAuthenticated = false;

    $scope.getOutlookLink = function () {
      ionicLoadingService.showLoading();
      $http.get(serverUrl + '/authUrl').then(
        function (success) {
          $scope.outlookLink = success.data;
          $scope.getOutlookInfo();
        }, function (err) {
          // error
        });
    };

    $scope.getOutlookInfo = function () {
      $http.get(serverUrl + '/outlook_get_info').then(
        function (success) {
          var data = success.data;
          $scope.expirationDate = new Date(data["expirationDate"]);
          $scope.email = data["email"];
          $scope.updateAuthentication();
          ionicLoadingService.hideLoading();
        }, function (err) {
          $scope.updateAuthentication();
          ionicLoadingService.hideLoading();
        });
    };

    $scope.updateOutlookCalendar = function () {
      $http.get(serverUrl + '/update_calendar').then(
        function (success) {
          var alertPopup = $ionicPopup.alert({
            title: 'Calendário',
            cssClass: 'outlook-alert-popup-success',
            template: 'O seu calendário foi atualizado com sucesso.'
          });
        }, function (err) {
          var alertPopup = $ionicPopup.alert({
            title: 'Calendário',
            cssClass: 'outlook-alert-popup-error',
            template: 'Houve um erro na atualização do seu calendário!'
          });
        });
    };

    $scope.updateAuthentication = function () {
      if ($scope.email == undefined) {
        $scope.isAuthenticated = false;
      }

      if ($scope.expirationDate == undefined) {
        $scope.isAuthenticated = false;
      }

      var date = new Date();
      $scope.isAuthenticated = ($scope.expirationDate.getTime() > date.getTime());
    }
  });
