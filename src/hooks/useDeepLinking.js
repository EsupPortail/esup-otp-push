import { useRoute } from "@react-navigation/native";
import { useEffect } from "react";
import { DeepAuthHandler } from "../services/deeplinkAuthService";

export default function useDeepLinking() {
    const { params } = useRoute();

    console.log('[useDeepLinking] route params : ', params);

    useEffect(() => {
        if (params) {
            DeepAuthHandler(params);
        }
    }, [params]);
}