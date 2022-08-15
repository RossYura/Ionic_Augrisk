import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { CognitoService, CognitoUser } from '../services/cognito.service';
import { environment } from 'src/environments/environment';


@Injectable()
export class HttpAuthorizationInterceptor implements HttpInterceptor {
    constructor(private cognitoService: CognitoService) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // set header to let HTTP_INTERCEPTORS know to handle or not.
        // { headers: { 'Anonymous': '' } }
        // to skip the anonymous http request
        if (request.headers.get('Anonymous')) {
            const newHeaders = request.headers.delete('Anonymous');
            const newRequest = request.clone({ headers: newHeaders });
            return next.handle(newRequest);
        } else {
            return from(this.handleAccess(request, next));
        }
    }
    /**
     * This function to solve the problem of using async into the interceptor
     */
    private async handleAccess(request: HttpRequest<any>, next: HttpHandler):
        Promise<HttpEvent<any>> {
        const cognitoUser = this.cognitoService.userPool.getCurrentUser();
        const idToken = await this.getIdToken(cognitoUser);
        request = request.clone({
            setHeaders: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`
            }
        });
        return next.handle(request).toPromise();
    }
    /**
     * This function checks if the idToken is valid & return the correct idToken
     * For some reason, users logged with Facebook must use accessToken and others idToken 
     */
    private async getIdToken(cognitoUser: CognitoUser): Promise<string> {
        return new Promise((resolve, reject) => {
            cognitoUser.getSession(async (err, session) => {
                if (!session.isValid()) {
                    if (!environment.production) console.log('http interceptor: session is not valid : ', session.refreshToken.token);
                    const newSession = await this.cognitoService.renew(session.refreshToken.token);
                    //if (isFacebook) resolve(newSession.access_token);
                    //else resolve(newSession.id_token);
                    resolve(newSession.id_token);
                } else {
                    if (!environment.production) console.log('http interceptor: session is valid', session);
                    // if (isFacebook) resolve (session.accessToken.jwtToken)
                    // else resolve(session.idToken.jwtToken);
                    resolve(session.idToken.jwtToken);
                }
            });
        })
    }
}
