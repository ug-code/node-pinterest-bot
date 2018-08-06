const Board   = require('./src/api/board/board');
const Pinner  = require('./src/api/pinner/pinner');
const Auth    = require('./src/api/auth/auth');
const PinCore = require('./src/api/core/pinCore');


class PinBot extends PinCore {

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

    board() {
        let board        = new Board(this._config);
        board.csrfToken  = this._csrfToken;
        board.cookieJar  = this._cookieJar;
        board.isLoggedIn = true;
        return board;
    }

    pinner() {
        let pinner         = new Pinner(this._config);
        pinner.csrfToken  = this._csrfToken;
        pinner.cookieJar  = this._cookieJar;
        pinner.isLoggedIn = true;
        return pinner;

    }

}

module.exports = PinBot;