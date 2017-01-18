// The code below is the asynchronous loading of the facebook API
(function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

window.fbAsyncInit = function () {
  FB.init({
    appId: '1046778285368752',
    xfbml: true,
    version: 'v2.4'
  });
};

// Below we create the service for OAuth authentication
var appModule = angular.module('itBirthday');
appModule.service('FBAuth', function ($q, $http, $ionicLoading, $ionicPopup) {

  var postNewFacebookInfo = function(userID, token, callback) {
    $http.post(serverUrl + '/post_facebook_info/', {
      userID: userID,
      token: token
    }).success(function () {
      callback();
    });
  };

  this.loginFacebook = function (callback) {
    var defer = $q.defer();

    FB.login(function (response) {

      if (response.status === "connected") {
        var userID = response["authResponse"]["userID"];
        var token = response["authResponse"]["accessToken"];

        FB.api("/" + userID, {fields: "name"}, function (response) {
          if (response && !response.error) { // Success
            var newLoginName = response.name;
            $http.get(serverUrl + '/get_facebook_login_status').then(
              function (success) {
                var dbData = success.data;
                if(dbData == undefined || dbData.id == userID) {
                  postNewFacebookInfo(userID, token, callback);
                } else if(dbData.id != userID) {
                  var confirmPopup = $ionicPopup.confirm({
                    title: 'Atenção!',
                    cssClass: 'facebook-confirm-popup',
                    template: 'Está prestes a fazer login nesta aplicação como <b>' + newLoginName + '</b>,' +
                    'mas os dados do login anterior estão marcados como pertencendo a <b>' + dbData.name + '</b>.' +
                    '<br>Tem a certeza que pretende continuar?<br>(Nota: Para fazer login com outro utilizador que ' +
                    'não <b>' + newLoginName + '</b> deverá efetuar nesta máquina o login nessa conta, e só depois ' +
                    'clicar no botão <b>Atualizar</b>).',
                    cancelText: 'Não',
                    cancelType: 'button-dark',
                    okText: 'Sim',
                    okType: 'button-assertive'
                  });

                  confirmPopup.then(function(res) {
                    if(res) { // affirmative response
                      postNewFacebookInfo(userID, token, callback);
                    } else {
                      return defer.promise;
                    }
                  });
                }
              }, function () {
                // Can still post new information,
                // even if cannot retrieve old.
                postNewFacebookInfo(userID, token, callback);
              });
          } else { // Error
            return defer.promise;
          }
        });
      }
    }, {
      scope: 'public_profile, email, publish_actions, publish_pages',
      return_scopes: true
    });

    return defer.promise;
  };

  this.getLoginStatus = function () {
    var defer = $q.defer();

    $http.get(serverUrl + '/get_facebook_login_status').then(
      function (success) {
        defer.resolve(success.data);
      }, function () {
        defer.resolve(undefined);
      });

    return defer.promise;
  };
});

angular.module('itBirthday.facebook', [])
  .controller('FacebookCtrl', function ($scope, $http, FBAuth, ionicLoadingService) {

    $scope.loggedIn = false;
    $scope.fbName = "";
    $scope.fbMail = "";
    $scope.expirationDate = "";
    $scope.updating = true;

    $scope.updateFacebookInfo = function () {
      ionicLoadingService.showLoading();
      $scope.updating = true;
      var state = getLoginUserStatus();

      state.then(function (data) {
        $scope.updating = false;
        ionicLoadingService.hideLoading();

        if (data == undefined) {
          $scope.loggedIn = false;
        } else {
          $scope.loggedIn = true;
          $scope.fbName = data.name;
          $scope.fbMail = data.email;
          $scope.updateExpirationDate();
        }
      });
    };

    $scope.updateExpirationDate = function () {
      $http.get(serverUrl + '/get_facebook_expiration_date').then(
        function (success) {
          $scope.expirationDate = new Date(success.data).toLocaleString();
        }, function () {
          $scope.expirationDate = "";
        });
    };

    $scope.loginFacebook = function () {
      loginFacebookUser();
    };

    function loginFacebookUser() {
      return FBAuth.loginFacebook($scope.updateFacebookInfo);
    }

    function getLoginUserStatus() {
      return FBAuth.getLoginStatus();
    }

    angular.element(document).ready(function () {
      $scope.updateFacebookInfo();
    });
  });
