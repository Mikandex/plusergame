import { axiosClient } from "@/globalApi";
import useWalletStore from "@/store/WalletStore";
import Toast from "react-native-toast-message";

const getWallet = async (runOnBackground: boolean) => {

  const { setWalletInfo, setBalanceLoading } = useWalletStore.getState();

  if(!runOnBackground){
    setBalanceLoading(true);
  }

  try {
    const result = await axiosClient.get("/wallet/");

    console.log("balance data", result.data);

    const payload = result.data;

    const allBalances = {
      total: payload?.balance ?? 0,
      bonus: Number(payload?.bonus_balance ?? 0),
      playing: Number(payload?.playing_balance ?? 0),
      winning: Number(payload?.winning_balance ?? 0),
    };

    setWalletInfo(allBalances);

  } catch (error: any) {
    Toast.show({
      type: "error",
      text1: error.response?.data?.message || "Failed to fetch wallet balance",
    });
  } finally {
    if(!runOnBackground){
      setBalanceLoading(false);
    }
  }
};

export default getWallet;