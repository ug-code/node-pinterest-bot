var PinCore = require('../core/pinCore');
var rp      = require('request-promise');


class Auth extends PinCore {

    constructor(options = {}) {
        super(options);

        this._csrfToken = '';
        this._cookieJar = rp.jar();
        this._isLoggedIn = false;

    }

    get cookieJar() {
        return this._cookieJar;
    }

    get csrfToken() {
        return this._csrfToken;
    }


    /**
     *
     * @param username
     * @param password
     */
     checkCredentials(username,password){
        if (!username || !password) {
            throw new Error('You must set username and password to login');
        }
    }
    /**
     *
     * @returns {Promise<void>}
     */
    async getLoginPageCSRF() {

        this.log("getLoginPageCSRF");
        await  rp({
            url: 'https://www.pinterest.com/login/',
            headers: {},
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {

            for (var i in response.headers['set-cookie']) {
                var cookieHeader = response.headers['set-cookie'][i];
                this.log('COOKIE ' + i + ': ' + cookieHeader);

                // Get csrf token
                var matches = cookieHeader.match(/csrftoken=([a-zA-Z0-9]+);/);
                if (matches && matches[1]) {
                    this._csrfToken = matches[1];
                }
            }

        }).catch(function (err) {
            console.log("Caught! Auth getLoginPageCSRF: ", err.statusCode);
        });


    }

    /**
     *
     * @returns {Promise<void>}
     */
    async doLogin() {
        this.log('_doLogin');

        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/UserSessionResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': this._csrfToken,
                'X-NEW-APP': '1',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/login/',
                'Accept-Encoding': 'gzip,deflate,sdch',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            form: {
                source_url: '/login/',
                data: '{"options":{"username_or_email":"' + this._config.mail + '","password":"' + this._config.password + '"},"context":{}}',
                module_path: 'App()>LoginPage()>Login()>Button(class_name=primary, text=Log In, type=submit, size=large)'
            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: _doLogin');
            var cookies = this._cookieJar.getCookieString('https://www.pinterest.com');

            var matches = cookies.match(/csrftoken=([a-zA-Z0-9]+);/);
            if (matches && matches[1]) {
                this._csrfToken = matches[1];
            } else {
                // Error!
                this.log('couldn\'t extract csrf token from cookies: doLogin');
                new Error('Unable to get pinning CSRF Token');
                return;
            }

            this.log('NEW CSRF:' + this._csrfToken);
        }).catch(function (err) {
            console.log("Caught! Auth doLogin: ", err.statusCode);
        });

    } //_doLogin


    /**
     *
     * @returns {Promise<void>}
     */
    async init() {
        await this.getLoginPageCSRF();
        await this.doLogin();
    }


}

module.exports = Auth;





