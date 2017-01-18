angular.module('itBirthday.login', [])

  .controller('LoginCtrl', function ($scope, $state, $http, ionicLoadingService, $ionicPopup) {
    $scope.user = {};
    $scope.errorMessage = '';

    $scope.resetInputFields = function() {
      var inputs = $('input').each(function(key, data) {
        var $data = $(data);
        $data.css('border','none');
        $data.val('');
      });
    };

    //log out
    $scope.logout = function () {
      if ("session" in localStorage) localStorage.removeItem("session");
      $state.go('login');
    };

    $scope.showWrongDataPopup = function() {
      $('input').css('border','1px solid #FF9A9A');
      $ionicPopup.alert({
        title: 'Erro no Login',
        cssClass: "login-alert-popup",
        template: 'Os dados inseridos estão incorretos. ' +
        'Por favor insira o nome de utilizador e a palavra-passe de administrador.'
      });
    };

    $scope.login = function () {
      var user = $scope.user;
      ionicLoadingService.showLoading();

      if(user.username == undefined || user.username == '') {
        ionicLoadingService.hideLoading();
        $scope.showWrongDataPopup();
        return false;
      } else if(user.password == undefined || user.password == '') {
        ionicLoadingService.hideLoading();
        $scope.showWrongDataPopup();
        return false;
      } else {
        $http.post(serverUrl + '/check_login', {
          username: user.username,
          password: CryptoJS.SHA256(user.password).toString()
        }).success(function (data) {
          ionicLoadingService.hideLoading();
          user.password = undefined;

          if ("session" in localStorage) {
            localStorage.removeItem("session");
          }

          localStorage.setItem("session", JSON.stringify(data));

          $state.go('tabs.dash');
        }).error(function (err) {
          user.password = undefined;
          ionicLoadingService.hideLoading();
          $scope.showWrongDataPopup();
          return false;
        });
      }
    }
  })

  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter, {'event': event});
          });

          event.preventDefault();
        }
      });
    }
  });

//admin
//"password" : "68e656b251e67e8358bef8483ab0d51c6619f3e7a1a9f0e75838d41ff368f728"
