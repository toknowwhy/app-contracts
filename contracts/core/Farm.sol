// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "../interfaces/ITicketToken.sol";
// import "../interfaces/ITokenFactory.sol";

import "hardhat/console.sol";

contract Farm is Ownable {

    using SafeMath for uint256;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20 lpToken;             // Address of LP token contract.
        uint256 allocPoint;          // How many allocation points assigned to this pool. CAKEs to distribute per block.
        uint256 lastRewardBlock;    // Last block number that CAKEs distribution occurs.
        uint256 accCakePerShare;    // Accumulated CAKEs per share, times 1e12. See below.
    }

    struct UserLockInfo{
        uint256 amount;
        uint256 unLockTime;
        uint256 multiplier; // 倍数
        uint256 rewardDebt;
        uint256 pid;
    }

    // struct PeriodInfo {
    //     uint256 accCakePerShareArchive;  // 这个period结束的时候的 accCakePerShare
    //     uint256 blockNumber;
    //     uint256 ticketAmount;
    // }

    uint256[] public accCakePerShareArchive;  // 这个period结束的时候的 accCakePerShare

    uint256 public totalAllocPoint = 0;

    uint256 public startBlock;

    uint256 public cakePerBlock;
    uint256[] public periodAmount;
    uint256 public periodBlock; 
    uint256 public periodIndex;

    uint256 public lastPeriodStartBlock;

    address public tokenFactory;

    mapping (address => mapping (uint256 => UserLockInfo)) public userLock;
    mapping (address => uint256) public userUnlockIndexs;

    PoolInfo[] public poolInfo;

    uint256 public multiplier1; // 锁一个月一倍， 2个月2倍。。。。
    uint256 public multiplier2;
    uint256 public multiplier3;
    uint256 public multiplier4;

    address public un;

    uint256[5] public lockTime;

    uint256[5] public multipliers;

    mapping (uint256 => mapping (address => UserInfo)) public userInfo; // pid => user => info 

    constructor(
        // uint256[] memory _periodAmount, 
        uint256 _periodBlock,
        uint256 _cakePerBlock,
        uint256 _startBlock,
        // address _tokenFactory,
        address _un
    ) {
        // periodAmount = _periodAmount; // 一共奖励多少
        periodBlock = _periodBlock; // 一个 period 周期是多少个block

        // tokenFactory = _tokenFactory;
        cakePerBlock = _cakePerBlock;   // 每个块奖励多少个 token
        startBlock = _startBlock; // 开始块
        lastPeriodStartBlock = startBlock;

        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock; 

        // lockTime[0] = 30 days;
        lockTime[1] = 30 days;
        lockTime[2] = 90 days;
        lockTime[3] = 180 days;
        lockTime[4] = 360 days;
        un = _un;
    }

    function period() public view returns(uint256) {
        uint256 _time =  block.timestamp - startBlock;
    }

    function setMultiplier(uint256 _multiplier1, uint256 _multiplier2, uint256 _multiplier3, uint256 _multiplier4 ) public onlyOwner{
        multipliers[1] = _multiplier1;
        multipliers[2] = _multiplier2;
        multipliers[3] = _multiplier3;
        multipliers[4] = _multiplier4;
    }

    function add(uint256 _allocPoint, IERC20 _lpToken) public onlyOwner {
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accCakePerShare: 0
        }));
        updateStakingPool();
    }

    // lock LP
    function depositAndLock(uint256 _pid, uint256 _multiplierIndex, uint256 _amount) public { 
        require(_amount > 0, 'Farm: amount cannot be 0');
        require(_multiplierIndex > 0 && _multiplierIndex <= 4, "Farm: _multiplierIndex <= 4");

        updatePool(_pid, multipliers[_multiplierIndex]);
        
        PoolInfo memory pool = poolInfo[_pid];
        pool.lpToken.transferFrom(address(msg.sender), address(this), _amount);

        userUnlockIndexs[msg.sender] =  userUnlockIndexs[msg.sender].add(1);
        uint256 _unlockTime =  lockTime[_multiplierIndex] + block.timestamp;
        userLock[msg.sender][userUnlockIndexs[msg.sender]] =  UserLockInfo(_amount, _unlockTime, multipliers[_multiplierIndex], 0, _pid);
    }

    // 提取lock 到期的 LP
    function withdraw( uint256 _lockIndex, uint256 _amount) public {
        require(_amount > 0, 'Farms: amount cannot be 0');
        UserLockInfo storage userLockInfo = userLock[msg.sender][_lockIndex];
        require(block.timestamp > userLockInfo.unLockTime, 'Farm: Not expired');
        require(userLockInfo.amount > 0, 'Farm: Not amount');
       
        updatePool(_pid, multipliers[_multiplierIndex]);
        
        transfer(msg.sender, _amount);
        userLockInfo.amount = userLockInfo.amount.sub(_amount);
    }

    // 提取奖励
    // TODO:  _ticket 不能自己指定
    function claim(uint256 _userUnlockIndex, uint256 _period, address _to) public {

        UserLockInfo storage userLockInfo = userLock[msg.sender][_userUnlockIndex];
        PoolInfo storage pool = poolInfo[userLockInfo.pid];
        updatePool(userLockInfo.pid, userLockInfo.multiplier);
        
        uint256 _accCakePerShare = accCakePerShareArchive[_period];
        // uint256 _accCakePerShare =  periodAccCakePerShare;

        if (userLockInfo.amount > 0) {

            uint256 pending = userLockInfo.amount.mul(_accCakePerShare).div(1e12).sub(userLockInfo.rewardDebt);
            // console.log("claim:",pending);

            if(pending > 0) {
                // ITokenFactory(tokenFactory).mint(_ticket, msg.sender, pending);
                IERC20(un).transfer(_to, pending);
                // console.log(pending);
            }
        }
        userLockInfo.rewardDebt = userLockInfo.amount.mul(_accCakePerShare).div(1e12);
    }

    function claimAll(uint256[] memory _userUnlockIndexs) public {
        
    }

    function pendingRewardsPeriod(uint256 _userUnlockIndex,  uint256 _period, address _user) public view returns(uint256) {
        if(accCakePerShareArchive.length <= _period ) {
            return 0;
        }

        UserLockInfo storage userLockInfo = userLock[_user][_userUnlockIndex];
        PoolInfo storage pool = poolInfo[userLockInfo.pid];
        uint256 accCakePerShare = accCakePerShareArchive[_period];

        // uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        // if (block.number > pool.lastRewardBlock && lpSupply != 0) {
        //     uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, userLockInfo.multiplier);

        //     uint256 cakeReward = multiplier.mul(cakePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        //     accCakePerShare = accCakePerShare.add(cakeReward.mul(1e12).div(lpSupply));
        // }
        // console.log("pendingRewards:", accCakePerShare, userLockInfo.amount, _user);
        return userLockInfo.amount.mul(accCakePerShare).div(1e12).sub(userLockInfo.rewardDebt);
    }

    // 实时计算出来。某个池子的在某个周期内的奖励
    function pendingRewards(uint256 _userUnlockIndex, address _user) public view returns(uint256) {
        UserLockInfo storage userLockInfo = userLock[_user][_userUnlockIndex];

        PoolInfo storage pool = poolInfo[userLockInfo.pid];
        uint256 accCakePerShare = pool.accCakePerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, userLockInfo.multiplier);
            uint256 cakeReward = multiplier.mul(cakePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accCakePerShare = accCakePerShare.add(cakeReward.mul(1e12).div(lpSupply));
        }
        // console.log("pendingRewards:", accCakePerShare, userLockInfo.amount, _user);
        return userLockInfo.amount.mul(accCakePerShare).div(1e12).sub(userLockInfo.rewardDebt);
    }

    function pendingRewards2(uint256 _userUnlockIndex, address _user) public view returns(uint256, uint256, uint256, uint256) {
        UserLockInfo storage userLockInfo = userLock[_user][_userUnlockIndex];
        PoolInfo storage pool = poolInfo[userLockInfo.pid];
     
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));

        uint256 totalPedding;
        uint256 unLockPadding;
        uint256 accCakePerShare = pool.accCakePerShare;
    //   console.log("pendingRewards2:", block.number > pool.lastRewardBlock);
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, userLockInfo.multiplier);
            uint256 cakeReward = multiplier.mul(cakePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accCakePerShare = accCakePerShare.add(cakeReward.mul(1e12).div(lpSupply));
        }
        
        totalPedding = userLockInfo.amount.mul(accCakePerShare).div(1e12).sub(userLockInfo.rewardDebt);

        if(accCakePerShareArchive.length > 0) {
            for(uint i = 0; i< accCakePerShareArchive.length; i++) {
                uint256 accCakePerShare1 = accCakePerShareArchive[i];
                unLockPadding += userLockInfo.amount.mul(accCakePerShare1).div(1e12).sub(userLockInfo.rewardDebt);
            }
        }
       
        return (
            userLockInfo.amount,
            userLockInfo.unLockTime,
            totalPedding,
            unLockPadding
        );
    }

    function updateStakingPool() internal {
        uint256 length = poolInfo.length;
        uint256 points = 0;
        for (uint256 pid = 1; pid < length; ++pid) {
            points = points.add(poolInfo[pid].allocPoint);
        }
        if (points != 0) {
            points = points.div(3);
            totalAllocPoint = totalAllocPoint.sub(poolInfo[0].allocPoint).add(points);
            poolInfo[0].allocPoint = points;
        }
    }

    // function massUpdatePools() public {
    //     uint256 length = poolInfo.length;
    //     for (uint256 pid = 0; pid < length; ++pid) {
    //         updatePool(pid);
    //     }
    // }

    function updatePool(uint256 _pid, uint256 _multiplier) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        //   console.log("updatePool:",lpSupply);
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        updatePeriod(_multiplier, pool.lastRewardBlock, pool.allocPoint,  pool.accCakePerShare, lpSupply);

        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number, _multiplier);

        uint256 cakeReward = multiplier.mul(cakePerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        // cake.mint(devaddr, cakeReward.div(10));
        // cake.mint(address(syrup), cakeReward);
        // console.log("updatePool:",cakeReward);
        pool.accCakePerShare = pool.accCakePerShare.add(cakeReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // period到期了，就记录下 period到期的那个块的累积量
    function updatePeriod(uint256 _multiplier, uint256 _lastRewardBlock, uint256 _allocPoint, uint256 _accCakePerShare, uint256 _lpSupply) internal {
        uint256 diffBlock = block.number.sub(lastPeriodStartBlock);
        if(diffBlock >= periodBlock) {
             uint256 multiplier = getMultiplier(_lastRewardBlock, startBlock.add(periodBlock) , _multiplier);
             uint256 cakeReward = multiplier.mul(cakePerBlock).mul(_allocPoint).div(totalAllocPoint);
            accCakePerShareArchive.push(_accCakePerShare.add(cakeReward.mul(1e12).div(_lpSupply)));
            lastPeriodStartBlock = lastPeriodStartBlock.add(periodBlock);
        }
    }

    function transfer(address _to, uint256 _amount) internal {
    }

    function getMultiplier(uint256 _from, uint256 _to, uint256 _multiplier) public view returns (uint256) {
        return _to.sub(_from).mul(_multiplier);
    }
}