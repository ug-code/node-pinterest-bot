var Auth    = require('../auth/auth');
var PinCore = require('../pinCore');
var rp      = require('request-promise');

class Board extends PinCore {

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
     * @param params
     * @returns {Promise<void>}
     */
    async create(params = {boardName: '', description: '', boardCategory: '', boardPrivacy: 'public'}) {

        if (!this._isLoggedIn) {
            await this.auth();
        }


        let boardName     = params.boardName;
        let description   = params.description;
        let boardCategory = params.boardCategory;
        let boardPrivacy  = params.boardPrivacy;
        let username      = this._config.username;

        let payload = {
            "options":
                {
                    "name": boardName, "category": boardCategory, "description": description, "privacy": boardPrivacy, "layout": "default"
                },
            "context": {}
        };

        this.log('_createBoard');
        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/BoardResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': this._csrfToken,
                'X-NEW-APP': '1',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com/' + username + '/',
                'Accept-Language': 'en-US,en;q=0.8'
            },
            gzip: true,
            form: {
                source_url: '/' + username + '/',
                data: JSON.stringify(payload)
            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: _createBoard', response);
        }).catch(function (err) {
            console.log("Caught! Board create: ", err.statusCode);
        });


    }


    /**
     *
     * @param boardid
     * @param user
     * @returns {Promise<void>}
     */
    async sendInvite(boardid = "313422524006965473", user = "494340634006530268") {

        if (!this._isLoggedIn) {
            await this.auth();
        }
        this.log('sendInvite');

        let payload = {"options": {"board_id": boardid, "invited_user_ids": [user]}, "context": {}};
        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/BoardInviteResource/create/',
            headers: this.header(),
            //gzip: true,
            form: {
                source_url: '',
                data: JSON.stringify(payload)

            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: sendInvite');
        }).catch(function (err) {
            /**
             *  @param {{resource_respons:array}} response
             */
            if (err.statusCode == 429) {
                if (err.response.body != null) {
                    console.log("sendInvite spam message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else if (err.statusCode == 403) {
                if (err.response.body != null) {
                    console.log("sendInvite Warning  message : ", JSON.parse(err.response.body).resource_response);
                }
            }
            else {
                console.log("Caught! Board sendInvite: ", err);
            }


        });

    }


    /**
     *
     * @param board_id
     * @param page
     * @returns {Promise<Array>}
     */
    async invitesFor(board_id, page = 1) {

        var limit = page * 20;
        if (!this._isLoggedIn) {
            await this.auth();
        }
        this.log('invitesFor');


        var result    = [];
        var response;
        var length    = 0;
        var bookmarks = [];


        while (limit > length || page == 0) {

            await this.waitFor(this._pagination_time);

            var payload = {
                "options":
                    {
                        "bookmarks": bookmarks,
                        "board_id": "313422524006965473",
                        "field_set_key": "boardEdit",
                        "status_filters": "new,accepted,contact_request_not_approved",
                        "sort": "viewer_first",
                        "include_inactive": true
                    },
                "context": {}
            };

            response = await  rp({
                method: 'POST',
                url: 'https://www.pinterest.com/resource/BoardInvitesResource/get/',
                headers: this.header(),
                //gzip: true,
                form: {
                    source_url: '',
                    data: JSON.stringify(payload)
                },
                jar: this._cookieJar,
                resolveWithFullResponse: true

            }).promise().bind(this).then(function (response) {

                this.log('SUCCESS: invitesFor');

                var body = JSON.parse(response.body);


                /**
                 * @param {{resource_response:string}} body
                 *  @param {{bookmarks:array}} body
                 */
                var data  = body.resource_response.data;
                bookmarks = body.resource.options.bookmarks;
                length += data.length;

                return data;

            }).catch(function (err) {
                if (err.statusCode == 429) {
                    if (err.response.body != null) {
                        console.log("invitesFor spam message : ", JSON.parse(err.response.body).resource_response);
                    }
                }
                else if (err.statusCode == 403) {
                    if (err.response.body != null) {
                        console.log("invitesFor Warning message : ", JSON.parse(err.response.body).resource_response);
                    }
                }
                else {
                    console.log("Caught! Board invitesFor ", err);
                }
            });
            if (response.length === 0) {
                this.log('response length: ' + response.length);
                break;
            }
            result.push(response);

        }

        return result;
    }


    /**
     *
     * @param board_id
     * @param page
     * @returns {Promise<Array>}
     */
    async getInvitesUserId(board_id, page = 1) {
        return await this.invitesFor(board_id, page).then(function (response) {

            var user_list = [];

            /**
             * @param {{invited_user:string}} invitesFor
             */
            var invitesFor = Object.values(response);
            for (var userList in invitesFor) {
                if (invitesFor.hasOwnProperty(userList)) {
                    for (var user in invitesFor[userList]) {
                        if (invitesFor[userList].hasOwnProperty(user)) {
                            user_list.push({
                                user_id: invitesFor[userList][user].invited_user.id,
                                status: invitesFor[userList][user].status
                            });
                        }
                    }
                }
            }
            return user_list;


        });


    }

    /**
     *
     * @param board_id
     * @param page
     * @returns {Promise<Array>}
     *
     * test board_id =61643157338625723  -   870 followers
     */
    async followers(board_id = "61643157338625723", page = 1) {

        var limit = page * 50;
        if (!this._isLoggedIn) {
            await this.auth();
        }
        this.log('followers');


        var result    = [];
        var response;
        var length    = 0;
        var bookmarks = [];


        while (limit > length || page == 0) {

            await this.waitFor(this._pagination_time);

            let payload = {
                "options": {
                    "board_id": board_id, "bookmarks": bookmarks,
                    "page_size": 50
                }, "context": {}
            };

            response = await  rp({
                method: 'POST',
                url: 'https://www.pinterest.com/resource/BoardFollowersResource/get/',
                headers: this.header(),
                //gzip: true,
                form: {
                    source_url: '',
                    data: JSON.stringify(payload)

                },
                jar: this._cookieJar,
                resolveWithFullResponse: true

            }).promise().bind(this).then(function (response) {
                this.log('SUCCESS: followers');

                var body = JSON.parse(response.body);

                /**
                 * @param {{resource_response:string}} body
                 *  @param {{bookmarks:array}} body
                 */
                var data  = body.resource_response.data;
                bookmarks = body.resource.options.bookmarks;
                length += data.length;

                return data;
            }).catch(function (err) {
                /**
                 *  @param {{resource_respons:array}} response
                 */
                if (err.statusCode == 429) {
                    if (err.response.body != null) {
                        console.log("sendInvite spam message : ", JSON.parse(err.response.body).resource_response);
                    }
                }
                else if (err.statusCode == 403) {
                    if (err.response.body != null) {
                        console.log("sendInvite Warning  message : ", JSON.parse(err.response.body).resource_response);
                    }
                }
                else {
                    console.log("Caught! Board sendInvite: ", err);
                }


            });

            if (response.length === 0) {
                this.log('response length: ' + response.length);
                break;
            }
            result.push(response);
        }
        return result;


    }

    /**
     *
     * @param board_id
     * @param page
     * @returns {Promise<Array>}
     *
     * My custom followers method
     */
    async getFollowersWithRule(board_id, page = 1) {

        const LAST_PIN_SAVE_DAY_RULE = 10;
        const FOLLOWER_COUNT_RULE    = 40;
        const BOARD_COUNT_RULE       = 5;
        const PIN_COUNT_RULE         = 30;

        var user_list = [];

        var followers = await this.followers(board_id, page);

        /**
         * @param {{invited_user:string}} invitesFor
         */
        var pagination_followers = Object.values(followers);

        for (var follower_list in pagination_followers) {
            if (pagination_followers.hasOwnProperty(follower_list)) {
                for (var user in pagination_followers[follower_list]) {

                    if (pagination_followers[follower_list].hasOwnProperty(user)) {
                        var pagi_followers = pagination_followers[follower_list][user];

                        /**
                         * @param {{last_pin_save_time:string}} pagi_followers
                         * @param {{follower_count:string}} pagi_followers
                         * @param {{board_count:string}} pagi_followers
                         * @param {{pin_count:string}} pagi_followers
                         * @param {{explicitly_followed_by_me:string}} pagi_followers
                         */

                        var username                  = pagi_followers.username;
                        var last_pin_save_day         = Board.userActiveDate(pagi_followers.last_pin_save_time);
                        var follower_count            = pagi_followers.follower_count;
                        var id                        = pagi_followers.id;
                        var board_count               = pagi_followers.board_count;
                        var pin_count                 = pagi_followers.pin_count;
                        var explicitly_followed_by_me = pagi_followers.explicitly_followed_by_me;

                        if (last_pin_save_day < LAST_PIN_SAVE_DAY_RULE
                            && follower_count > FOLLOWER_COUNT_RULE
                            && board_count > BOARD_COUNT_RULE
                            && pin_count > PIN_COUNT_RULE

                        ) {
                            user_list.push({
                                username: username,
                                last_pin_save_day: last_pin_save_day,
                                follower_count: follower_count,
                                id: id,
                                board_count: board_count,
                                pin_count: pin_count,
                                explicitly_followed_by_me: explicitly_followed_by_me

                            });

                        }
                    }
                }
            }
        }

        return user_list;
    }

}


module.exports = Board;
