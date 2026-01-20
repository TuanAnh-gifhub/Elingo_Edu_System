package org.rent.room.be.Utils;

import org.apache.commons.codec.digest.DigestUtils;

public class Hash {
    public static String hashToken(String token) {
        return DigestUtils.sha256Hex(token);
    }
}
