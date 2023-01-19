// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TigresPool is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    IERC20Upgradeable public immutable token0;
    IERC20Upgradeable public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public poolTokenReserve;

    event Swap(address indexed _trader, address indexed _token, uint256 indexed _tradeValue);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor() {
    //     _disableInitializers();
    // }

    constructor (
        IERC20Upgradeable _token0,
        IERC20Upgradeable _token1
    ) {
        token0 = _token0;
        token1 = _token1;
    }

    function swap(address _tokenIn, uint256 _amountIn)
        external
        returns (uint256 amountOut)
    {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            "Invalid token being swapped"
        );
        require(
            _amountIn > 0,
            "Amount of token being swapped must be greater than 0"
        );

        bool isToken0 = _tokenIn == address(token0);

        (
            IERC20Upgradeable tokenIn,
            IERC20Upgradeable tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0 
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);

        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        uint256 amountInWithFee = (_amountIn * 997) / 1000;
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);

        tokenOut.transfer(msg.sender, amountOut);

        _updatePool(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
        emit Swap(msg.sender, _tokenIn, _amountIn);

    }

    function addLiquidity(uint256 _amount0, uint256 _amount1)
        external
        returns (uint256 poolTokens)

    {
        token0.transferFrom(msg.sender, address(this), _amount0);
        token1.transferFrom(msg.sender, address(this), _amount1);

        if (poolTokenReserve == 0) {
            poolTokens = _sqrt(_amount0 * _amount1);
        } else {
            poolTokens = _min(
                (_amount0 * poolTokenReserve) / reserve0,
                (_amount1 * poolTokenReserve) / reserve1
            );
        }
        require(
            poolTokens > 0,
            "Amount of Pool Tokens being rewarded must be greater than 0."
        );

        _mint(msg.sender, poolTokens);

        _updatePool(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }
     
    function removeLiquidity(uint256 _shares)
        external
        returns (uint256 withdrawAmount0, uint256 withdrawAmount1)
    {

        uint256 poolBalance0 = token0.balanceOf(address(this));
        uint256 poolBalance1 = token1.balanceOf(address(this));

        withdrawAmount0 = (_shares * poolBalance0) / poolTokenReserve;
        withdrawAmount1 = (_shares * poolBalance1) / poolTokenReserve;
        require(withdrawAmount0 > 0 && withdrawAmount1 > 0, "withdrawAmount0 or withdrawAmount1 = 0");

        _burn(msg.sender, _shares);
        _updatePool(poolBalance0 - withdrawAmount0, poolBalance1 - withdrawAmount1);

        token0.transfer(msg.sender, withdrawAmount0);
        token1.transfer(msg.sender, withdrawAmount1);
    }

    function initialize() initializer public {
        __ERC20_init("poolTigres", "pTG");
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 1000000 * 10 ** decimals());

    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}

    function _updatePool(uint256 _reserve0, uint256 _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}