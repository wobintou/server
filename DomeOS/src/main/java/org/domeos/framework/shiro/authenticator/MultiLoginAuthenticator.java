package org.domeos.framework.shiro.authenticator;

import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.pam.ModularRealmAuthenticator;
import org.apache.shiro.realm.Realm;
import org.domeos.framework.api.model.auth.related.LoginType;
import org.domeos.framework.shiro.token.MultiAuthenticationToken;

import java.util.Collection;

/**
 * Created by feiliu206363 on 2015/12/11.
 */

public class MultiLoginAuthenticator extends ModularRealmAuthenticator {

    @Override
    protected AuthenticationInfo doAuthenticate(AuthenticationToken authenticationToken) throws AuthenticationException {
        assertRealmsConfigured();
        MultiAuthenticationToken mlat;
        Realm loginRealm;

        if (!(authenticationToken instanceof MultiAuthenticationToken)) {
            throw new AuthenticationException("Unrecognized token , not a typeof MultiLoginAuthenticationToken ");
        }

        mlat = (MultiAuthenticationToken) authenticationToken;
        loginRealm = lookupRealm(mlat.getType());

        return doSingleRealmAuthentication(loginRealm, authenticationToken);
    }

    protected Realm lookupRealm(LoginType loginType) throws AuthenticationException {
        Collection<Realm> realms = getRealms();
        for (Realm realm : realms) {
            if (realm.getName().equalsIgnoreCase(loginType.name())) {
                return realm;
            }
        }
        throw new AuthenticationException("No realm configured for login type " + loginType);
    }
}