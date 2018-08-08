var Auth    = require('../auth/auth');
var PinCore = require('../core/pinCore');
var rp      = require('request-promise');

class Pinner extends PinCore {

    constructor(options = {}) {
        super(options);
        this._pagination_time = 800; //0.8 second
    }

    async auth() {
        var auth = new Auth(this._config);
        await auth.init();
        this._csrfToken  = auth.csrfToken;
        this._cookieJar  = auth.cookieJar;
        this._isLoggedIn = true;
    }


    header() {
        return {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': this._csrfToken,
            'X-NEW-APP': '1',
            'Origin': 'https://www.pinterest.com',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Referer': 'https://www.pinterest.com',
            'Accept-Language': 'en-US,en;q=0.8'
        };
    };


    /**
     * 
     * @param user_id
     * @param page
     * @returns {Promise<void>}
     */
    async getFollowing(user_id , page = 1){

    }

    /**
     *
     * @param user_id
     * @param page
     * @returns {Promise<void>}
     */
    async getFollowers(user_id , page = 1){

    }

    /**
     *
     * @param user_id
     * @returns {Promise<void>}
     */
    async follow(user_id) {

        this.log('follow');

        let payload = {"options":{"user_id":user_id},"context":{}};
        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/UserFollowResource/create/',
            headers: this.header(),
            //gzip: true,
            form: {
                source_url: '',
                data: JSON.stringify(payload)

            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: Pinner follow');
        }).catch(function (err) {
            /**
             *  @param {{resource_respons:array}} response
             */
            if (err.statusCode == 429) {
                if (err.response.body != null) {
                    console.log("follow spam message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else if (err.statusCode == 403) {
                if (err.response.body != null) {
                    console.log("follow Warning  message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else {
                console.log("Caught! Pinner follow: ", err);
            }


        });

    }

    /**
     *
     * @param user_id
     * @returns {Promise<void>}
     */
    async unFollow(user_id) {


        this.log('unFollow');

        let payload = {"options":{"user_id":user_id},"context":{}};
        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/UserFollowResource/delete/',
            headers: this.header(),
            //gzip: true,
            form: {
                source_url: '',
                data: JSON.stringify(payload)

            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: Pinner unFollow');
        }).catch(function (err) {
            /**
             *  @param {{resource_respons:array}} response
             */
            if (err.statusCode == 429) {
                if (err.response.body != null) {
                    console.log("unFollow spam message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else if (err.statusCode == 403) {
                if (err.response.body != null) {
                    console.log("unFollow Warning  message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else {
                console.log("Caught! Pinner unFollow: ", err);
            }


        });


    }



}


module.exports = Pinner;