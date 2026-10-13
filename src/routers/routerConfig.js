/**
 * 导入页面路径
 */
import ChoiceWallet from '../screens/Wallet/ChoiceWallet';//选择钱包
import CreateWallet from '../screens/Wallet/CreateWallet';//创建钱包
import ImportWallet from '../screens/Wallet/ImportWallet';//导入钱包
import BackupsWallet from '../screens/Wallet/BackupsWallet';//备份钱包提示
import BackupsWords from '../screens/Wallet/BackupsWords';//备份助记词
import ConfirmWords from '../screens/Wallet/ConfirmWords';//备份助记词
import ManageWallet from '../screens/Wallet/ManageWallet';//钱包信息
import PlatformMessage from '../screens/Notice/PlatformMessage';//平台公告
import MessageDetails from '../screens/Notice/MessageDetails';//平台公告详情
import Transfer from '../screens/Wallet/Transfer';//转账
import Receive from '../screens/Wallet/Receive';//收款
import Browser from '../screens/Chain/Browser';//Browser
import ScanScreen from '../screens/Wallet/ScanScreen';//Browser
import AddToken from '../screens/Wallet/AddToken';//AddToken
import TransferRecord from '../screens/Wallet/TransferRecord';//TransferRecord
import TransferDetails from '../screens/Wallet/TransferDetails';//TransferDetails
import Settings from '../screens/SetIng/Settings';//语言设置
import AddressBook from '../screens/My/AddressBook';//AddressBook
import InviteFriend from '../screens/My/InviteFriend';//InviteFriend
import Bridgers from '../screens/Bridgers'
import BridgersRecord from '../screens/Wallet/BridgersRecord'
import ApprovalCheck from '../screens/Wallet/ApprovalCheck';
import KLine from '../screens/KLine';
import Swap from '../screens/Swap';


import DappIndex from '../screens/Chain/DappItem/DappIndex';//DappIndex
import DappBrowser from '../screens/Chain/DappItem/DappBrowser';
import Password from "../screens/SetIng/Password";
import UpdatePayPassword from "../screens/SetIng/UpdatePayPassword";
//DappBrowser

/**
 * 页面配置
 */
export default {
    ChoiceWallet:{screen: ChoiceWallet},
    CreateWallet:{screen: CreateWallet},
    ImportWallet:{screen: ImportWallet},
    BackupsWallet:{screen: BackupsWallet},
    ConfirmWords:{screen: ConfirmWords},
    BackupsWords:{screen: BackupsWords},
    PlatformMessage:{screen: PlatformMessage},
    MessageDetails:{screen: MessageDetails},
    Transfer:{screen: Transfer},
    Browser:{screen: Browser},
    ScanScreen:{screen: ScanScreen},
    Receive:{screen: Receive},
    Settings:{screen: Settings},
    Password:{screen: Password},
    UpdatePayPassword:{screen: UpdatePayPassword},

    CrossBridge:{screen: Bridgers},
    BridgersRecord:{screen: BridgersRecord},
    DappIndex:{screen: DappIndex},
    DappBrowser:{screen: DappBrowser},
    ManageWallet:{screen: ManageWallet},
    TransferRecord:{screen: TransferRecord},
    TransferDetails:{screen: TransferDetails},
    AddToken:{screen: AddToken},
    AddressBook:{screen: AddressBook},
    InviteFriend:{screen: InviteFriend},
    ApprovalCheck:{screen: ApprovalCheck},
    KLine:{screen: KLine},
    Swap:{screen: Swap},
};
