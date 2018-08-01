var Auth    = require('../auth/auth');
var PinCore = require('../pinCore');
var rp      = require('request-promise');

class Board extends PinCore {

    constructor(options = {}) {
        super(options);
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
                /*
                 module_path: 'App()>UserProfilePage(resource=UserResource(username=' + username + ', invite_code=null))>UserProfileContent(resource=UserResource(username=' + username + ', invite_code=null))>UserBoards()>Grid(resource=ProfileBoardsResource(username=' + username + '))>GridItems(resource=ProfileBoardsResource(username=' + username + '))>BoardCreateRep(submodule=[object Object], ga_category=board_create)#Modal(module=BoardCreate()'
                 */
            },
            jar: this._cookieJar,
            resolveWithFullResponse: true

        }).promise().bind(this).then(function (response) {
            this.log('SUCCESS: _createBoard');
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

        let payload = {"options": {"board_id": "313422524006965473", "invited_user_ids": ["494340634006530268"]}, "context": {}};
        await  rp({
            method: 'POST',
            url: 'https://www.pinterest.com/resource/BoardInviteResource/create/',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': this._csrfToken,
                'X-NEW-APP': '1',
                'Origin': 'https://www.pinterest.com',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Referer': 'https://www.pinterest.com',
                'Accept-Language': 'en-US,en;q=0.8'
            },
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

            var response = JSON.parse(err.response.body);
            if (err.statusCode == 429) {
                console.log("sendInvite Spamm!!!");
                if (err.response.body != null) {
                    console.log("spam message : ", this.resourceResponse(response));
                }
            }
            else if (err.statusCode == 403) {
                console.log("Warning sendInvite");
                if (err.response.body != null) {
                    console.log("Warning message : ", this.resourceResponse(response));
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
                var response = JSON.parse(err.response.body);
                if (err.statusCode == 429) {
                    console.log("invitesFor Spamm!!!");
                    if (err.response.body != null) {
                        console.log("spam message : ", this.resourceResponse(response));
                    }
                }
                else if (err.statusCode == 403) {
                    console.log("Warning invitesFor");
                    if (err.response.body != null) {
                        console.log("Warning message : ", this.resourceResponse(response));
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


    async followers(board_id, page = 1) {

    }

}


module.exports = Board;
